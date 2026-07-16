import { describe, expect, it } from 'vitest';

import { builtinDocuments, parseDocument, parseDocumentFile } from './documents';

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
