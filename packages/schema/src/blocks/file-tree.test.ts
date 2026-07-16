import { describe, expect, it } from 'vitest';

import { fileTreeSchema } from './file-tree.js';

describe('fileTreeSchema', () => {
  it('accepts entries with status, rename origin, and inferred flag', () => {
    const result = fileTreeSchema.safeParse({
      id: 'ft1',
      type: 'file-tree',
      entries: [
        { path: 'src/app.ts', status: 'modified' },
        { path: 'src/new-name.ts', status: 'renamed', from: 'src/old-name.ts' },
        { path: 'src/util.ts', status: 'added', note: '신규 헬퍼', inferred: true },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty entries', () => {
    expect(fileTreeSchema.safeParse({ id: 'ft1', type: 'file-tree', entries: [] }).success).toBe(
      false,
    );
  });
});
