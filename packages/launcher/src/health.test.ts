import { createServer, type Server } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import { fetchViewerInfo, isReusable, type ViewerInfo } from './health.js';

const servers: Server[] = [];

function validInfo(overrides: Partial<ViewerInfo> = {}): ViewerInfo {
  return {
    name: 'previs-viewer',
    version: '0.6.0',
    docsDir: '/tmp/project/.previs',
    pid: 1234,
    startedAt: 1,
    ...overrides,
  };
}

function startServer(handler: (path: string) => { status: number; body: unknown }): Promise<number> {
  return new Promise((resolve) => {
    const server = createServer((request, response) => {
      const result = handler(request.url ?? '/');
      response.statusCode = result.status;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(result.body));
    });
    servers.push(server);
    server.listen({ host: '127.0.0.1', port: 0 }, () => {
      const address = server.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });
}

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
});

describe('isReusable', () => {
  it('accepts a matching identity and docsDir', () => {
    expect(isReusable(validInfo(), '/tmp/project/.previs')).toBe(true);
  });

  it('rejects null, foreign name, or mismatched docsDir', () => {
    expect(isReusable(null, '/tmp/project/.previs')).toBe(false);
    expect(isReusable(validInfo({ name: 'other' }), '/tmp/project/.previs')).toBe(false);
    expect(isReusable(validInfo(), '/tmp/other/.previs')).toBe(false);
  });
});

describe('fetchViewerInfo', () => {
  it('returns the parsed payload for a healthy viewer', async () => {
    const port = await startServer(() => ({ status: 200, body: validInfo() }));
    expect(await fetchViewerInfo(port)).toEqual(validInfo());
  });

  it('returns null for a malformed payload', async () => {
    const port = await startServer(() => ({ status: 200, body: { name: 'previs-viewer' } }));
    expect(await fetchViewerInfo(port)).toBeNull();
  });

  it('returns null for a non-200 response', async () => {
    const port = await startServer(() => ({ status: 500, body: { message: 'boom' } }));
    expect(await fetchViewerInfo(port)).toBeNull();
  });

  it('returns null when nothing is listening', async () => {
    const port = await startServer(() => ({ status: 200, body: validInfo() }));
    await new Promise<void>((resolve) => {
      servers.splice(0).forEach((server) => server.close(() => resolve()));
    });
    expect(await fetchViewerInfo(port, 500)).toBeNull();
  });
});
