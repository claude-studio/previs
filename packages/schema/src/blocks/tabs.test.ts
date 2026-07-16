import { describe, expect, it } from 'vitest';

import { tabsSchema } from './tabs.js';

describe('tabsSchema', () => {
  it('accepts items with nested blocks', () => {
    const result = tabsSchema.safeParse({
      id: 't1',
      type: 'tabs',
      items: [
        { label: '변경 1', blocks: [{ id: 'p1', type: 'prose', markdown: '내용' }] },
        { label: '변경 2', blocks: [{ id: 'p2', type: 'prose', markdown: '내용' }] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an item with no blocks', () => {
    const result = tabsSchema.safeParse({
      id: 't1',
      type: 'tabs',
      items: [{ label: '빈 탭', blocks: [] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a nested block that fails its own schema', () => {
    const result = tabsSchema.safeParse({
      id: 't1',
      type: 'tabs',
      items: [{ label: '탭', blocks: [{ id: 'p1', type: 'prose', markdown: '' }] }],
    });
    expect(result.success).toBe(false);
  });
});
