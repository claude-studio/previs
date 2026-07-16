// @vitest-environment node
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { Connect, ViteDevServer } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';

import { previsDocsPlugin } from './previs-docs-plugin';

interface InvokeResult {
  status: number;
  body: unknown;
  nextCalled: boolean;
}

function createHandler(projectRoot: string): Connect.NextHandleFunction {
  const plugin = previsDocsPlugin(projectRoot);
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
    throw new Error('configureServer hook missing');
  }
  void configureServer(server);

  if (!handler) {
    throw new Error('middleware not registered');
  }
  return handler;
}

function invoke(
  handler: Connect.NextHandleFunction,
  { url = '/api/documents', method = 'GET' } = {},
): Promise<InvokeResult> {
  return new Promise((resolve) => {
    const response = {
      statusCode: 0,
      setHeader() {},
      end(chunk?: unknown) {
        resolve({
          status: response.statusCode,
          body: chunk ? JSON.parse(String(chunk)) : null,
          nextCalled: false,
        });
      },
    };
    const next = () => resolve({ status: 0, body: null, nextCalled: true });
    handler(
      { url, method } as never,
      response as never,
      next as never,
    );
  });
}

async function createProjectRoot(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'previs-docs-'));
}

describe('previsDocsPlugin', () => {
  afterEach(() => {
    delete process.env.PREVIS_DOCS_DIR;
  });

  it('responds with empty lists when the documents directory is missing', async () => {
    const handler = createHandler(await createProjectRoot());
    const result = await invoke(handler);

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ documents: [], errors: [] });
  });

  it('lists json documents and reports unparsable files', async () => {
    const projectRoot = await createProjectRoot();
    const documentsDirectory = path.join(projectRoot, '.previs');
    await mkdir(documentsDirectory);
    await writeFile(
      path.join(documentsDirectory, 'plan-a.json'),
      JSON.stringify({ title: '문서 A' }),
    );
    await writeFile(path.join(documentsDirectory, 'broken.json'), '{');
    await writeFile(path.join(documentsDirectory, 'notes.txt'), 'ignored');

    const handler = createHandler(projectRoot);
    const result = await invoke(handler);

    expect(result.status).toBe(200);
    const payload = result.body as {
      documents: { fileName: string; mtimeMs: number; raw: unknown }[];
      errors: { fileName: string; message: string }[];
    };
    expect(payload.documents.map(({ fileName }) => fileName)).toEqual(['plan-a.json']);
    expect(payload.documents[0]?.raw).toEqual({ title: '문서 A' });
    expect(payload.errors.map(({ fileName }) => fileName)).toEqual(['broken.json']);
  });

  it('serves the PREVIS_DOCS_DIR override instead of the project default', async () => {
    const projectRoot = await createProjectRoot();
    const overrideDirectory = await mkdtemp(path.join(tmpdir(), 'previs-override-'));
    await writeFile(
      path.join(overrideDirectory, 'plan-b.json'),
      JSON.stringify({ title: '문서 B' }),
    );

    process.env.PREVIS_DOCS_DIR = overrideDirectory;
    const handler = createHandler(projectRoot);
    const result = await invoke(handler);

    const payload = result.body as { documents: { fileName: string }[] };
    expect(payload.documents.map(({ fileName }) => fileName)).toEqual(['plan-b.json']);
  });

  it('passes through requests for other paths and methods', async () => {
    const handler = createHandler(await createProjectRoot());

    expect((await invoke(handler, { url: '/api/other' })).nextCalled).toBe(true);
    expect((await invoke(handler, { method: 'POST' })).nextCalled).toBe(true);
  });
});
