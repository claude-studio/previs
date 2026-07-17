import { readFileSync, unlinkSync } from 'node:fs';
import type { ServerResponse } from 'node:http';

import type { Plugin } from 'vite';

const VIEWER_INFO_PATH = '/api/viewer-info';
const VIEWER_NAME = 'previs-viewer';
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 60 * 1000;

export interface PrevisRuntimePluginOptions {
  docsDir: string;
  version: string;
  lockPath?: string;
}

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function ownsRunningLock(lockPath: string): boolean {
  try {
    const record = JSON.parse(readFileSync(lockPath, 'utf8')) as Record<string, unknown>;
    return record.phase === 'running' && record.pid === process.pid;
  } catch {
    return false;
  }
}

function removeOwnedLock(lockPath: string | undefined): void {
  if (!lockPath || !ownsRunningLock(lockPath)) {
    return;
  }

  try {
    unlinkSync(lockPath);
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
      throw error;
    }
  }
}

export function previsRuntimePlugin(options: PrevisRuntimePluginOptions): Plugin {
  const lockPath = options.lockPath?.trim() || undefined;
  const startedAt = Date.now();
  let lastActivity = Date.now();
  let cleanupComplete = false;
  let idleTimer: NodeJS.Timeout | undefined;

  const cleanup = () => {
    if (cleanupComplete) {
      return;
    }

    cleanupComplete = true;
    if (idleTimer) {
      clearInterval(idleTimer);
    }
    removeOwnedLock(lockPath);
  };

  const handleSignal = (signal: 'SIGINT' | 'SIGTERM') => {
    cleanup();
    process.exit(signal === 'SIGINT' ? 130 : 143);
  };

  return {
    name: 'previs-runtime',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        lastActivity = Date.now();
        const requestPath = new URL(request.url ?? '/', 'http://previs.local').pathname;

        if (requestPath !== VIEWER_INFO_PATH || request.method !== 'GET') {
          next();
          return;
        }

        sendJson(response, 200, {
          name: VIEWER_NAME,
          version: options.version,
          docsDir: options.docsDir,
          pid: process.pid,
          startedAt,
        });
      });

      if (!lockPath) {
        return;
      }

      idleTimer = setInterval(() => {
        if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
          cleanup();
          process.exit(0);
        }
      }, IDLE_CHECK_INTERVAL_MS);

      process.on('SIGINT', () => handleSignal('SIGINT'));
      process.on('SIGTERM', () => handleSignal('SIGTERM'));
      process.on('exit', cleanup);
    },
  };
}
