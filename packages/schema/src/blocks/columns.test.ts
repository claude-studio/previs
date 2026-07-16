import { describe, expect, it } from 'vitest';

import { columnsSchema } from './columns.js';

const column = (id: string) => ({
  blocks: [{ id, type: 'prose', markdown: '내용' }],
});

describe('columnsSchema', () => {
  it('accepts 2 to 4 columns', () => {
    const two = columnsSchema.safeParse({ id: 'c1', type: 'columns', items: [column('a'), column('b')] });
    expect(two.success).toBe(true);
  });

  it('rejects a single column', () => {
    const result = columnsSchema.safeParse({ id: 'c1', type: 'columns', items: [column('a')] });
    expect(result.success).toBe(false);
  });

  it('rejects five columns', () => {
    const result = columnsSchema.safeParse({
      id: 'c1',
      type: 'columns',
      items: [column('a'), column('b'), column('c'), column('d'), column('e')],
    });
    expect(result.success).toBe(false);
  });
});
