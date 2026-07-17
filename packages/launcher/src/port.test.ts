import { createServer as createHttpServer, type Server as HttpServer } from 'node:http';
import { createServer as createNetServer, type Server as NetServer } from 'node:net';

import { afterEach, describe, expect, it } from 'vitest';

import { PORT_END, PORT_START } from './paths.js';
import { resolveBandPort } from './port.js';

const DOCS_DIR = '/tmp/project/.previs';
const netServers: NetServer[] = [];
const httpServers: HttpServer[] = [];

function occupy(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = createNetServer((socket) => socket.destroy());
    netServers.push(server);
    server.once('error', reject);
    server.listen({ host: '127.0.0.1', port }, () => resolve());
  });
}

function serveViewer(port: number, docsDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = createHttpServer((request, response) => {
      if (request.url === '/api/viewer-info') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        response.end(
          JSON.stringify({
            name: 'previs-viewer',
            version: '0.6.0',
            docsDir,
            pid: 4321,
            startedAt: 1,
          }),
        );
        return;
      }
      response.statusCode = 404;
      response.end();
    });
    httpServers.push(server);
    server.once('error', reject);
    server.listen({ host: '127.0.0.1', port }, () => resolve());
  });
}

afterEach(async () => {
  await Promise.all([
    ...netServers.splice(0).map(
      (server) => new Promise<void>((resolve) => server.close(() => resolve())),
    ),
    ...httpServers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.closeAllConnections();
          server.close(() => resolve());
        }),
    ),
  ]);
});

describe('resolveBandPort', () => {
  it('rejects a start port outside the dedicated band', async () => {
    await expect(resolveBandPort(PORT_START - 1, DOCS_DIR)).rejects.toThrow();
    await expect(resolveBandPort(PORT_END + 1, DOCS_DIR)).rejects.toThrow();
  });

  it('returns a free port when the candidate is available', async () => {
    const resolution = await resolveBandPort(PORT_START, DOCS_DIR);
    expect(resolution.kind).toBe('free');
    expect(resolution.port).toBeGreaterThanOrEqual(PORT_START);
    expect(resolution.port).toBeLessThanOrEqual(PORT_END);
  });

  it('skips a foreign occupant and searches upward within the band', async () => {
    await occupy(PORT_START);

    const resolution = await resolveBandPort(PORT_START, DOCS_DIR);
    expect(resolution.kind).toBe('free');
    expect(resolution.port).toBeGreaterThan(PORT_START);
  });

  it('adopts an already-running previs viewer occupying the candidate port', async () => {
    await serveViewer(PORT_START, DOCS_DIR);

    const resolution = await resolveBandPort(PORT_START, DOCS_DIR);
    expect(resolution.kind).toBe('adopt');
    expect(resolution.port).toBe(PORT_START);
    if (resolution.kind === 'adopt') {
      expect(resolution.info.docsDir).toBe(DOCS_DIR);
    }
  });

  it('does not adopt a viewer serving a different docsDir', async () => {
    await serveViewer(PORT_START, '/tmp/other/.previs');

    const resolution = await resolveBandPort(PORT_START, DOCS_DIR);
    expect(resolution.kind).toBe('free');
    expect(resolution.port).toBeGreaterThan(PORT_START);
  });
});
