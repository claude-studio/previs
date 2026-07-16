import { describe, expect, it } from 'vitest';

import { annotatedCodeSchema } from './annotated-code.js';

const base = {
  id: 'ac1',
  type: 'annotated-code',
  lang: 'typescript',
  code: 'const a = 1;\nconst b = 2;\nconst c = a + b;',
};

describe('annotatedCodeSchema', () => {
  it('accepts annotations within the excerpt line range', () => {
    const result = annotatedCodeSchema.safeParse({
      ...base,
      startLine: 10,
      annotations: [
        { line: 1, markdown: '초기값' },
        { line: 3, markdown: '합산' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an annotation line beyond the excerpt', () => {
    const result = annotatedCodeSchema.safeParse({
      ...base,
      annotations: [{ line: 4, markdown: '범위 밖' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects line 0 (lines are 1-based)', () => {
    const result = annotatedCodeSchema.safeParse({
      ...base,
      annotations: [{ line: 0, markdown: '0번 행' }],
    });
    expect(result.success).toBe(false);
  });
});
