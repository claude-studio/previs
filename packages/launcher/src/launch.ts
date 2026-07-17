import { closeSync, openSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';

import { fetchViewerInfo, isReusable, type ViewerInfo } from './health.js';
import {
  acquire,
  isStale,
  readLock,
  recoverStaleLock,
  removeLock,
  writeLock,
  type LockRecord,
  type StartingLockRecord,
} from './lock.js';
import { resolveBandPort } from './port.js';
import { resolveTarget, type ResolvedTarget } from './paths.js';

const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;
const DEFAULT_POLL_INTERVAL_MS = 100;
const CHILD_TERMINATION_TIMEOUT_MS = 2_000;

export interface LaunchResult {
  url: string;
  port: number;
  reused: boolean;
}

export interface LaunchOptions {
  projectRoot: string;
  env?: NodeJS.ProcessEnv;
  startupTimeoutMs?: number;
  pollIntervalMs?: number;
}

interface SpawnedViewer {
  child: ChildProcess;
  getError: () => Error | null;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function childExitMessage(child: ChildProcess): string | null {
  if (child.exitCode !== null) {
    return `뷰어 프로세스가 종료되었습니다(exit code ${child.exitCode}).`;
  }

  if (child.signalCode !== null) {
    return `뷰어 프로세스가 시그널로 종료되었습니다(${child.signalCode}).`;
  }

  return null;
}

function spawnViewer(
  target: ResolvedTarget,
  projectRoot: string,
  env: NodeJS.ProcessEnv,
  port: number,
): SpawnedViewer {
  let logFileDescriptor: number | undefined;

  try {
    logFileDescriptor = openSync(target.logPath, 'a');
    const child = spawn('pnpm', ['--filter', '@previs/viewer', 'dev'], {
      cwd: projectRoot,
      detached: true,
      stdio: ['ignore', logFileDescriptor, logFileDescriptor],
      env: {
        ...env,
        PREVIS_DOCS_DIR: target.docsDir,
        PREVIS_PORT: String(port),
        PREVIS_LOCK_PATH: target.lockPath,
      },
    });
    let spawnError: Error | null = null;
    child.once('error', (error: Error) => {
      spawnError = error;
    });
    child.unref();

    return {
      child,
      getError: () => spawnError,
    };
  } finally {
    if (logFileDescriptor !== undefined) {
      closeSync(logFileDescriptor);
    }
  }
}

function signalProcessGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ESRCH')) {
      throw error;
    }
  }
}

function isGroupAlive(pid: number): boolean {
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    return error instanceof Error && 'code' in error && error.code === 'EPERM';
  }
}

async function waitForGroupDeath(pid: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isGroupAlive(pid)) {
      return true;
    }
    await sleep(50);
  }
  return !isGroupAlive(pid);
}

async function terminateViewer(child: ChildProcess | null): Promise<void> {
  if (!child?.pid) {
    return;
  }

  const pid = child.pid;
  signalProcessGroup(pid, 'SIGTERM');
  if (await waitForGroupDeath(pid, CHILD_TERMINATION_TIMEOUT_MS)) {
    return;
  }

  signalProcessGroup(pid, 'SIGKILL');
  await waitForGroupDeath(pid, CHILD_TERMINATION_TIMEOUT_MS);
}

async function removeOwnedStartingLock(lockFilePath: string): Promise<void> {
  const record = await readLock(lockFilePath);
  if (record?.phase === 'starting' && record.owner === process.pid) {
    await removeLock(lockFilePath);
  }
}

function toLaunchResult(target: ResolvedTarget, port: number, reused: boolean): LaunchResult {
  return { url: `http://127.0.0.1:${port}`, port, reused };
}

async function findReusableViewer(
  target: ResolvedTarget,
  record: LockRecord | null,
): Promise<LaunchResult | null> {
  if (!record?.port) {
    return null;
  }

  const info = await fetchViewerInfo(record.port);
  return isReusable(info, target.docsDir) ? toLaunchResult(target, record.port, true) : null;
}

async function waitForConcurrentViewer(
  target: ResolvedTarget,
  startupDeadline: number,
  pollIntervalMs: number,
): Promise<LaunchResult | null> {
  while (Date.now() < startupDeadline) {
    const record = await readLock(target.lockPath);
    const reusable = await findReusableViewer(target, record);
    if (reusable) {
      return reusable;
    }

    if (!record) {
      return null;
    }

    if (isStale(record)) {
      const recovery = await recoverStaleLock(target.lockPath);
      if (recovery === 'recovered') {
        return null;
      }
    }

    await sleep(Math.min(pollIntervalMs, startupDeadline - Date.now()));
  }

  throw new Error('기존 previs 뷰어가 시작될 때까지 기다리는 시간이 초과되었습니다.');
}

async function acquireStartingLock(
  target: ResolvedTarget,
  startupDeadline: number,
  pollIntervalMs: number,
): Promise<StartingLockRecord | LaunchResult> {
  while (Date.now() < startupDeadline) {
    const currentRecord = await readLock(target.lockPath);
    const reusable = await findReusableViewer(target, currentRecord);
    if (reusable) {
      return reusable;
    }

    if (currentRecord) {
      if (isStale(currentRecord)) {
        const recovery = await recoverStaleLock(target.lockPath);
        if (recovery !== 'recovered') {
          await sleep(Math.min(pollIntervalMs, startupDeadline - Date.now()));
        }
        continue;
      }

      const concurrent = await waitForConcurrentViewer(target, startupDeadline, pollIntervalMs);
      if (concurrent) {
        return concurrent;
      }
      continue;
    }

    const handle = await acquire(target.lockPath);
    if (!handle) {
      await sleep(Math.min(pollIntervalMs, startupDeadline - Date.now()));
      continue;
    }

    const record: StartingLockRecord = {
      phase: 'starting',
      owner: process.pid,
      pid: null,
      port: null,
      startedAt: Date.now(),
    };

    try {
      await writeLock(target.lockPath, record);
      await handle.close();
      return record;
    } catch (error) {
      await handle.close();
      await removeLock(target.lockPath).catch(() => undefined);
      throw error;
    }
  }

  throw new Error('previs 뷰어 락을 획득할 수 없습니다.');
}

async function waitForStartedViewer(
  target: ResolvedTarget,
  port: number,
  spawned: SpawnedViewer,
  startupDeadline: number,
  pollIntervalMs: number,
): Promise<ViewerInfo> {
  while (Date.now() < startupDeadline) {
    const spawnError = spawned.getError();
    if (spawnError) {
      throw new Error(`뷰어 서버를 기동할 수 없습니다: ${spawnError.message}`);
    }

    const exitMessage = childExitMessage(spawned.child);
    if (exitMessage) {
      throw new Error(exitMessage);
    }

    const info = await fetchViewerInfo(port, Math.min(500, pollIntervalMs * 5));
    if (isReusable(info, target.docsDir)) {
      return info;
    }

    await sleep(Math.min(pollIntervalMs, startupDeadline - Date.now()));
  }

  throw new Error('뷰어 서버 헬스체크 시간이 초과되었습니다.');
}

export async function launch(options: LaunchOptions): Promise<LaunchResult> {
  const env = options.env ?? process.env;
  const startupTimeoutMs = options.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const target = resolveTarget(env, options.projectRoot);
  const startupDeadline = Date.now() + startupTimeoutMs;

  const existingRecord = await readLock(target.lockPath);
  const reusable = await findReusableViewer(target, existingRecord);
  if (reusable) {
    return reusable;
  }

  const acquired = await acquireStartingLock(target, startupDeadline, pollIntervalMs);
  if ('url' in acquired) {
    return acquired;
  }

  const startingRecord = acquired;
  let spawned: SpawnedViewer | null = null;

  try {
    const resolution = await resolveBandPort(target.candidatePort, target.docsDir);

    if (resolution.kind === 'adopt') {
      await writeLock(target.lockPath, {
        phase: 'running',
        owner: startingRecord.owner,
        pid: resolution.info.pid,
        port: resolution.port,
        startedAt: startingRecord.startedAt,
      });

      return toLaunchResult(target, resolution.port, true);
    }

    const port = resolution.port;
    await writeLock(target.lockPath, { ...startingRecord, port });

    spawned = spawnViewer(target, options.projectRoot, env, port);
    const info = await waitForStartedViewer(target, port, spawned, startupDeadline, pollIntervalMs);
    await writeLock(target.lockPath, {
      phase: 'running',
      owner: startingRecord.owner,
      pid: info.pid,
      port,
      startedAt: startingRecord.startedAt,
    });

    return toLaunchResult(target, port, false);
  } catch (error) {
    await terminateViewer(spawned?.child ?? null);
    await removeOwnedStartingLock(target.lockPath).catch(() => undefined);
    throw error;
  }
}
