import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  builtinDocuments,
  fetchPublishedDocuments,
  parseDocument,
  parseDocumentFile,
} from './documents';

describe('builtinDocuments', () => {
  it('loads the three fixtures through schema validation', () => {
    expect(builtinDocuments.map(({ document }) => document.id)).toEqual([
      'sample-plan',
      'sample-recap',
      'kitchen-sink',
    ]);
    expect(builtinDocuments.every((entry) => entry.origin === 'builtin')).toBe(true);
  });
});

describe('parseDocument', () => {
  it('accepts a schema-valid document', () => {
    const result = parseDocument({
      schemaVersion: 1,
      id: 'doc-1',
      kind: 'plan',
      title: '문서',
      createdAt: '2026-07-16T10:00:00Z',
      blocks: [{ id: 'p1', type: 'prose', markdown: '본문' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid document with a readable issue summary', () => {
    const result = parseDocument({ kind: 'plan' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});

describe('parseDocumentFile', () => {
  it('rejects a file that is not valid JSON', async () => {
    const file = new File(['not-json'], 'broken.json', { type: 'application/json' });
    const result = await parseDocumentFile(file);
    expect(result.success).toBe(false);
  });
});

describe('fetchPublishedDocuments', () => {
  const validRaw = {
    schemaVersion: 1,
    id: 'plan-20260716-sample',
    kind: 'plan',
    title: '발행 문서',
    createdAt: '2026-07-16T10:00:00Z',
    blocks: [{ id: 'p1', type: 'prose', markdown: '본문' }],
  };

  function stubFetch(response: Partial<Response> | Error) {
    const mock =
      response instanceof Error
        ? vi.fn().mockRejectedValue(response)
        : vi.fn().mockResolvedValue(response as Response);
    vi.stubGlobal('fetch', mock);
    return mock;
  }

  function jsonResponse(payload: unknown, status = 200): Partial<Response> {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(payload),
    };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses published documents and collects per-file failures', async () => {
    stubFetch(
      jsonResponse({
        documents: [
          { fileName: 'plan-a.json', mtimeMs: 1, raw: validRaw },
          { fileName: 'invalid.json', mtimeMs: 2, raw: { kind: 'plan' } },
        ],
        errors: [{ fileName: 'broken.json', message: 'Unexpected token' }],
      }),
    );

    const result = await fetchPublishedDocuments();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entries.map(({ document }) => document.id)).toEqual([
        'plan-20260716-sample',
      ]);
      expect(result.entries[0]?.origin).toBe('published');
      expect(result.errors.some((error) => error.startsWith('broken.json'))).toBe(true);
      expect(result.errors.some((error) => error.startsWith('invalid.json'))).toBe(true);
    }
  });

  it('distinguishes a transport failure from an empty directory', async () => {
    stubFetch(new Error('ECONNREFUSED'));
    const result = await fetchPublishedDocuments();
    expect(result.ok).toBe(false);
  });

  it('treats an HTTP error status as a failure', async () => {
    stubFetch(jsonResponse({}, 500));
    const result = await fetchPublishedDocuments();
    expect(result.ok).toBe(false);
  });

  it('rejects a payload with an unexpected shape', async () => {
    stubFetch(jsonResponse({ documents: 'nope' }));
    const result = await fetchPublishedDocuments();
    expect(result.ok).toBe(false);
  });
});
