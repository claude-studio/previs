// @vitest-environment node
import type { IncomingMessage, ServerResponse } from 'node:http';

import type { Connect, ViteDevServer } from 'vite';
import { describe, expect, it } from 'vitest';

import { previsRuntimePlugin } from './previs-runtime-plugin';

interface InvokeResult {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  nextCalled: boolean;
}

function createHandler(): Connect.NextHandleFunction {
  const plugin = previsRuntimePlugin({ docsDir: '/tmp/project/.previs', version: '9.9.9' });
  let handler: Connect.NextHandleFunction | undefined;
  const server = {
    middlewares: {
      use(middleware: Connect.NextHandleFunction) {
        handler = middleware;
      },
    },
  } as unknown as ViteDevServer;

  const hook = plugin.configureServer;
  const configureServer = typeof hook === 'function' ? hook : hook?.handler;
  if (!configureServer) {
    throw new Error('configureServer 훅이 없습니다.');
  }
  void configureServer(server);

  if (!handler) {
    throw new Error('미들웨어가 등록되지 않았습니다.');
  }
  return handler;
}

function invoke(method: string, url: string): Promise<InvokeResult> {
  const handler = createHandler();
  return new Promise((resolve) => {
    const headers: Record<string, string> = {};
    let body = '';
    let resolved = false;

    const response = {
      statusCode: 0,
      setHeader(name: string, value: string) {
        headers[name.toLowerCase()] = value;
      },
      end(chunk?: string) {
        if (chunk) {
          body += chunk;
        }
        if (!resolved) {
          resolved = true;
          resolve({
            status: this.statusCode,
            headers,
            body: body ? (JSON.parse(body) as unknown) : undefined,
            nextCalled: false,
          });
        }
      },
    } as unknown as ServerResponse;

    const request = { url, method } as IncomingMessage;

    handler(request, response, () => {
      if (!resolved) {
        resolved = true;
        resolve({ status: response.statusCode, headers, body: undefined, nextCalled: true });
      }
    });
  });
}

describe('previsRuntimePlugin', () => {
  it('runs in the pre phase so activity is stamped before the docs middleware', () => {
    const plugin = previsRuntimePlugin({ docsDir: '/tmp/.previs', version: '1.0.0' });
    expect(plugin.enforce).toBe('pre');
  });

  it('answers /api/viewer-info with the viewer identity', async () => {
    const result = await invoke('GET', '/api/viewer-info');

    expect(result.status).toBe(200);
    expect(result.nextCalled).toBe(false);
    expect(result.body).toMatchObject({
      name: 'previs-viewer',
      version: '9.9.9',
      docsDir: '/tmp/project/.previs',
    });
    expect(typeof (result.body as { pid: number }).pid).toBe('number');
  });

  it('passes other requests through to the next middleware', async () => {
    const documents = await invoke('GET', '/api/documents');
    expect(documents.nextCalled).toBe(true);

    const wrongMethod = await invoke('POST', '/api/viewer-info');
    expect(wrongMethod.nextCalled).toBe(true);
  });
});
