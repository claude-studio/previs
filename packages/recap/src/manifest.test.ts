import { describe, expect, it } from 'vitest';

import type { FileChange } from './inventory.js';
import { computeStats, evaluateSkip } from './manifest.js';

const change = (overrides: Partial<FileChange> = {}): FileChange => ({
  path: 'src/app.ts',
  status: 'modified',
  churn: 10,
  insertions: 6,
  deletions: 4,
  binary: false,
  ...overrides,
});

describe('computeStats', () => {
  it('sums insertions and deletions', () => {
    const stats = computeStats([
      change({ insertions: 6, deletions: 4 }),
      change({ path: 'b.ts', insertions: 3, deletions: 1 }),
    ]);
    expect(stats).toEqual({ files: 2, insertions: 9, deletions: 5 });
  });

  it('ignores binary churn', () => {
    const stats = computeStats([change({ binary: true, insertions: 0, deletions: 0, churn: null })]);
    expect(stats).toEqual({ files: 1, insertions: 0, deletions: 0 });
  });
});

describe('evaluateSkip', () => {
  it('recommends skip for a single small file', () => {
    const skip = evaluateSkip([change({ churn: 20, insertions: 15, deletions: 5 })], false);
    expect(skip.recommended).toBe(true);
    expect(skip.reason).toBeDefined();
  });

  it('does not skip when over the line threshold', () => {
    expect(evaluateSkip([change({ churn: 41, insertions: 41, deletions: 0 })], false).recommended).toBe(
      false,
    );
  });

  it('does not skip with multiple files', () => {
    expect(
      evaluateSkip([change(), change({ path: 'b.ts' })], false).recommended,
    ).toBe(false);
  });

  it('never skips when forced', () => {
    expect(evaluateSkip([change({ churn: 2, insertions: 2, deletions: 0 })], true).recommended).toBe(
      false,
    );
  });

  it('uses boundary of 40 lines inclusive', () => {
    expect(evaluateSkip([change({ churn: 40, insertions: 40, deletions: 0 })], false).recommended).toBe(
      true,
    );
  });
});
