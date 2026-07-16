import { describe, expect, it } from 'vitest';

import { classifyDiffLines } from './DiffBlock';

describe('classifyDiffLines', () => {
  it('classifies every +/- line in an excerpt without hunk headers', () => {
    expect(classifyDiffLines('+added\n-removed\n context')).toEqual([
      'add',
      'remove',
      undefined,
    ]);
  });

  it('classifies only lines inside hunks when @@ headers exist', () => {
    const diff = [
      '--- a/file.ts',
      '+++ b/file.ts',
      '@@ -1,2 +1,3 @@',
      ' context',
      '+added',
      '-removed',
    ].join('\n');
    expect(classifyDiffLines(diff)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      'add',
      'remove',
    ]);
  });

  it('classifies added code that itself starts with ++', () => {
    const diff = ['@@ -1 +1,2 @@', ' context', '+++counter;'].join('\n');
    expect(classifyDiffLines(diff)).toEqual([undefined, undefined, 'add']);
  });
});
