import { describe, expect, it } from 'vitest';

import { proseSchema } from './prose.js';

describe('proseSchema', () => {
  it('accepts a markdown block', () => {
    expect(proseSchema.safeParse({ id: 'p1', type: 'prose', markdown: '# 개요' }).success).toBe(
      true,
    );
  });

  it('rejects empty markdown', () => {
    expect(proseSchema.safeParse({ id: 'p1', type: 'prose', markdown: '' }).success).toBe(false);
  });
});
