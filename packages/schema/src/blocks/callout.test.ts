import { describe, expect, it } from 'vitest';

import { calloutSchema } from './callout.js';

describe('calloutSchema', () => {
  it('accepts a callout with variant and optional title', () => {
    const result = calloutSchema.safeParse({
      id: 'c1',
      type: 'callout',
      variant: 'warning',
      title: '주의',
      markdown: '스키마 변경은 additive만 허용.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown variant', () => {
    const result = calloutSchema.safeParse({
      id: 'c1',
      type: 'callout',
      variant: 'note',
      markdown: '본문',
    });
    expect(result.success).toBe(false);
  });
});
