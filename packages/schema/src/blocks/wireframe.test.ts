import { describe, expect, it } from 'vitest';

import { wireframeSchema } from './wireframe.js';

describe('wireframeSchema', () => {
  it('accepts a semantic html fragment with a surface preset', () => {
    const result = wireframeSchema.safeParse({
      id: 'wf1',
      type: 'wireframe',
      surface: 'browser',
      title: '문서 목록',
      html: '<main><h1>Documents</h1><ul><li>plan</li></ul></main>',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown surface preset', () => {
    const result = wireframeSchema.safeParse({
      id: 'wf1',
      type: 'wireframe',
      surface: 'tv',
      html: '<main></main>',
    });
    expect(result.success).toBe(false);
  });
});
