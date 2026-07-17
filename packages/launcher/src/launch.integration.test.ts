import { createServer, type Server } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { launch } from './launch.js';
import { readLock, removeLock, writeLock } from './lock.js';
import { resolveTarget } from './paths.js';

let projectRoot: string;
let lockFile: string;
const servers: Server[] = [];

function startFakeViewer(docsDir: string, port = 0): Promise<number> {
  return new Promise((resolve) => {
    const server = createServer((request, response) => {
      if (request.url === '/api/viewer-info') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        response.end(
          JSON.stringify({
            name: 'previs-viewer',
            version: '0.6.0',
            docsDir,
            pid: process.pid,
            startedAt: 1,
          }),
        );
        return;
      }
      response.statusCode = 404;
      response.end();
    });
    servers.push(server);
    server.listen({ host: '127.0.0.1', port }, () => {
      const address = server.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });
}

beforeEach(() => {
  projectRoot = mkdtempSync(path.join(os.tmpdir(), 'previs-launch-'));
  lockFile = resolveTarget({}, projectRoot).lockPath;
});

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.closeAllConnections();
          server.close(() => resolve());
        }),
    ),
  );
  await removeLock(lockFile);
  await removeLock(`${lockFile}.recover`);
  rmSync(projectRoot, { recursive: true, force: true });
});

describe('launch (integration)', () => {
  it('reuses an already-running viewer without spawning', async () => {
    const target = resolveTarget({}, projectRoot);
    const port = await startFakeViewer(target.docsDir);
    await writeLock(target.lockPath, {
      phase: 'running',
      owner: process.pid,
      pid: process.pid,
      port,
      startedAt: 1,
    });

    const result = await launch({ projectRoot });

    expect(result).toEqual({ url: `http://127.0.0.1:${port}`, port, reused: true });
  });

  it('lets concurrent callers converge on the single running viewer', async () => {
    const target = resolveTarget({}, projectRoot);
    const port = await startFakeViewer(target.docsDir);
    await writeLock(target.lockPath, {
      phase: 'running',
      owner: process.pid,
      pid: process.pid,
      port,
      startedAt: 1,
    });

    const results = await Promise.all([
      launch({ projectRoot }),
      launch({ projectRoot }),
      launch({ projectRoot }),
    ]);

    for (const result of results) {
      expect(result.reused).toBe(true);
      expect(result.port).toBe(port);
    }
  });

  it('adopts a lockless viewer already occupying the candidate port', async () => {
    const target = resolveTarget({}, projectRoot);
    await startFakeViewer(target.docsDir, target.candidatePort);

    const result = await launch({ projectRoot, startupTimeoutMs: 5_000, pollIntervalMs: 50 });

    expect(result.reused).toBe(true);
    expect(result.port).toBe(target.candidatePort);
    const record = await readLock(target.lockPath);
    expect(record?.phase).toBe('running');
    expect(record?.port).toBe(target.candidatePort);
  });

  it('cleans up its lock when a cold start fails to become healthy', async () => {
    await expect(
      launch({ projectRoot, startupTimeoutMs: 8_000, pollIntervalMs: 50 }),
    ).rejects.toThrow();

    expect(await readLock(lockFile)).toBeNull();
  });
});
