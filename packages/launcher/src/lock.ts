import { open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';

export interface StartingLockRecord {
  phase: 'starting';
  owner: number;
  pid: null;
  port: number | null;
  startedAt: number;
}

export interface RunningLockRecord {
  phase: 'running';
  owner: number;
  pid: number;
  port: number;
  startedAt: number;
}

export type LockRecord = StartingLockRecord | RunningLockRecord;
export type RecoveryResult = 'recovered' | 'busy' | 'not-stale';

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isPort(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 65535;
}

function parseLockRecord(value: unknown): LockRecord {
  if (typeof value !== 'object' || value === null) {
    throw new Error('락 파일 형식이 올바르지 않습니다.');
  }

  const record = value as Record<string, unknown>;
  if (!isPositiveInteger(record.owner) || typeof record.startedAt !== 'number') {
    throw new Error('락 파일 형식이 올바르지 않습니다.');
  }

  if (record.phase === 'starting') {
    if (record.pid !== null || (record.port !== null && !isPort(record.port))) {
      throw new Error('락 파일 형식이 올바르지 않습니다.');
    }

    return {
      phase: 'starting',
      owner: record.owner,
      pid: null,
      port: record.port as number | null,
      startedAt: record.startedAt,
    };
  }

  if (record.phase === 'running' && isPositiveInteger(record.pid) && isPort(record.port)) {
    return {
      phase: 'running',
      owner: record.owner,
      pid: record.pid,
      port: record.port,
      startedAt: record.startedAt,
    };
  }

  throw new Error('락 파일 형식이 올바르지 않습니다.');
}

export async function acquire(lockFilePath: string): Promise<FileHandle | null> {
  try {
    return await open(lockFilePath, 'wx', 0o600);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      return null;
    }

    throw error;
  }
}

export async function readLock(lockFilePath: string): Promise<LockRecord | null> {
  let contents: string;

  try {
    contents = await readFile(lockFilePath, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }

  if (contents.trim() === '') {
    return null;
  }

  let value: unknown;
  try {
    value = JSON.parse(contents) as unknown;
  } catch {
    throw new Error(`락 파일 JSON을 읽을 수 없습니다: ${lockFilePath}`);
  }

  return parseLockRecord(value);
}

export async function writeLock(lockFilePath: string, record: LockRecord): Promise<void> {
  const temporaryPath = `${lockFilePath}.${process.pid}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(record)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    await rename(temporaryPath, lockFilePath);
  } catch (error) {
    await removeLock(temporaryPath).catch(() => undefined);
    throw error;
  }
}

export async function removeLock(lockFilePath: string): Promise<void> {
  try {
    await unlink(lockFilePath);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error instanceof Error && 'code' in error && error.code === 'EPERM';
  }
}

export function isStale(record: LockRecord): boolean {
  return !isProcessAlive(record.phase === 'starting' ? record.owner : record.pid);
}

export async function recoverStaleLock(lockFilePath: string): Promise<RecoveryResult> {
  const recoveryPath = `${lockFilePath}.recover`;
  const recoveryHandle = await acquire(recoveryPath);
  if (!recoveryHandle) {
    return 'busy';
  }

  try {
    const currentRecord = await readLock(lockFilePath);
    if (!currentRecord) {
      return 'recovered';
    }

    if (!isStale(currentRecord)) {
      return 'not-stale';
    }

    await removeLock(lockFilePath);
    return 'recovered';
  } finally {
    await recoveryHandle.close();
    await removeLock(recoveryPath);
  }
}
