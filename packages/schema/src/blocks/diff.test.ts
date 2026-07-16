import { describe, expect, it } from 'vitest';

import { diffSchema } from './diff.js';

describe('diffSchema', () => {
  it('accepts a unified diff excerpt', () => {
    const result = diffSchema.safeParse({
      id: 'd1',
      type: 'diff',
      title: '스키마 검증 추가',
      file: 'src/document.ts',
      lang: 'typescript',
      diff: '@@ -1,2 +1,3 @@\n+import { z } from "zod";',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a diff without file path', () => {
    const result = diffSchema.safeParse({
      id: 'd1',
      type: 'diff',
      title: '제목',
      diff: '@@ -1 +1 @@',
    });
    expect(result.success).toBe(false);
  });
});
