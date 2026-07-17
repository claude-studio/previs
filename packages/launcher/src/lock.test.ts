import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  acquire,
  isStale,
  readLock,
  recoverStaleLock,
  removeLock,
  writeLock,
  type RunningLockRecord,
  type StartingLockRecord,
} from './lock.js';

let dir: string;
let lockFile: string;

function deadPid(): number {
  const result = spawnSync(process.execPath, ['-e', '']);
  if (typeof result.pid !== 'number') {
    throw new Error('dead pid를 만들 수 없습니다.');
  }
  return result.pid;
}

function runningRecord(overrides: Partial<RunningLockRecord> = {}): RunningLockRecord {
  return {
    phase: 'running',
    owner: process.pid,
    pid: process.pid,
    port: 47750,
    startedAt: 1,
    ...overrides,
  };
}

function startingRecord(overrides: Partial<StartingLockRecord> = {}): StartingLockRecord {
  return {
    phase: 'starting',
    owner: process.pid,
    pid: null,
    port: null,
    startedAt: 1,
    ...overrides,
  };
}

beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'previs-lock-'));
  lockFile = path.join(dir, 'viewer.lock');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('acquire', () => {
  it('grants exclusive ownership and rejects a second acquirer', async () => {
    const first = await acquire(lockFile);
    expect(first).not.toBeNull();
    const second = await acquire(lockFile);
    expect(second).toBeNull();
    await first?.close();
  });
});

describe('readLock / writeLock', () => {
  it('returns null for a missing or empty lock file', async () => {
    expect(await readLock(lockFile)).toBeNull();
    writeFileSync(lockFile, '   \n', 'utf8');
    expect(await readLock(lockFile)).toBeNull();
  });

  it('round-trips starting and running records', async () => {
    await writeLock(lockFile, startingRecord());
    expect(await readLock(lockFile)).toEqual(startingRecord());

    await writeLock(lockFile, runningRecord());
    expect(await readLock(lockFile)).toEqual(runningRecord());
  });

  it('throws on malformed JSON and malformed records', async () => {
    writeFileSync(lockFile, '{ not json', 'utf8');
    await expect(readLock(lockFile)).rejects.toThrow();

    writeFileSync(lockFile, JSON.stringify({ phase: 'running', owner: 1 }), 'utf8');
    await expect(readLock(lockFile)).rejects.toThrow();
  });
});

describe('isStale', () => {
  it('treats a live owner/pid as fresh', () => {
    expect(isStale(startingRecord({ owner: process.pid }))).toBe(false);
    expect(isStale(runningRecord({ pid: process.pid }))).toBe(false);
  });

  it('treats a dead owner (starting) or dead pid (running) as stale', () => {
    const dead = deadPid();
    expect(isStale(startingRecord({ owner: dead }))).toBe(true);
    expect(isStale(runningRecord({ pid: dead, owner: dead }))).toBe(true);
  });
});

describe('recoverStaleLock', () => {
  it('reports not-stale and keeps a live lock', async () => {
    await writeLock(lockFile, runningRecord({ pid: process.pid }));
    expect(await recoverStaleLock(lockFile)).toBe('not-stale');
    expect(await readLock(lockFile)).not.toBeNull();
  });

  it('removes a stale lock and reports recovered', async () => {
    await writeLock(lockFile, runningRecord({ pid: deadPid() }));
    expect(await recoverStaleLock(lockFile)).toBe('recovered');
    expect(await readLock(lockFile)).toBeNull();
  });

  it('reports recovered when no lock is present', async () => {
    expect(await recoverStaleLock(lockFile)).toBe('recovered');
  });

  it('reports busy when another recovery holds the recovery lock', async () => {
    await writeLock(lockFile, runningRecord({ pid: deadPid() }));
    const recoveryHandle = await acquire(`${lockFile}.recover`);
    expect(recoveryHandle).not.toBeNull();
    try {
      expect(await recoverStaleLock(lockFile)).toBe('busy');
      expect(await readLock(lockFile)).not.toBeNull();
    } finally {
      await recoveryHandle?.close();
      await removeLock(`${lockFile}.recover`);
    }
  });
});
