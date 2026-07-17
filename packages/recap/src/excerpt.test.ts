import { describe, expect, it } from 'vitest';

import {
  buildDiffCandidate,
  buildTitle,
  demotionReason,
  excerptDiff,
  langForPath,
  rankCandidates,
  type DiffCandidate,
} from './excerpt.js';
import type { FileChange } from './inventory.js';

const change = (overrides: Partial<FileChange> = {}): FileChange => ({
  path: 'src/app.ts',
  status: 'modified',
  churn: 10,
  insertions: 6,
  deletions: 4,
  binary: false,
  ...overrides,
});

describe('langForPath', () => {
  it('maps known extensions', () => {
    expect(langForPath('src/app.tsx')).toBe('tsx');
    expect(langForPath('doc.md')).toBe('markdown');
  });

  it('returns undefined for unknown extensions', () => {
    expect(langForPath('Makefile')).toBeUndefined();
    expect(langForPath('data.xyz')).toBeUndefined();
  });
});

describe('demotionReason', () => {
  it('demotes lockfiles and build output', () => {
    expect(demotionReason('pnpm-lock.yaml')).toBe('lockfile');
    expect(demotionReason('packages/x/dist/index.js')).toBe('생성물');
  });

  it('does not demote ordinary source', () => {
    expect(demotionReason('src/app.ts')).toBeUndefined();
  });
});

describe('buildTitle', () => {
  it('includes insertion/deletion counts', () => {
    expect(buildTitle(change({ insertions: 6, deletions: 4 }))).toBe('src/app.ts (+6 −4)');
  });

  it('appends binary marker instead of counts', () => {
    expect(buildTitle(change({ path: 'logo.png', binary: true }))).toBe('logo.png (바이너리)');
  });

  it('truncates paths over 70 chars from the front, keeping counts', () => {
    const long = 'src/' + 'a/'.repeat(50) + 'file.ts';
    const title = buildTitle(change({ path: long, insertions: 1, deletions: 2 }));
    expect(title.length).toBeLessThanOrEqual(70);
    expect(title.startsWith('…')).toBe(true);
    expect(title.endsWith('(+1 −2)')).toBe(true);
  });
});

describe('excerptDiff', () => {
  it('keeps short diffs whole', () => {
    const diff = '@@ -1 +1 @@\n-a\n+b';
    expect(excerptDiff(diff).truncated).toBe(false);
  });

  it('truncates a single oversized hunk internally', () => {
    const lines = ['@@ -1 +200 @@', ...Array.from({ length: 300 }, (_, i) => `+line ${i}`)];
    const result = excerptDiff(lines.join('\n'), 50);
    expect(result.truncated).toBe(true);
    expect(result.totalLines).toBe(301);
    expect(result.text.split('\n').length).toBeLessThanOrEqual(50);
  });

  it('keeps complete hunks and stops before the one that overflows', () => {
    const header = ['diff --git a/x b/x', '--- a/x', '+++ b/x'];
    const hunkA = ['@@ -1,2 +1,2 @@', '-a', '+A', ' ctx'];
    const hunkB = ['@@ -10,2 +10,2 @@', '-b', '+B', ' ctx'];
    const hunkC = ['@@ -20,2 +20,2 @@', '-c', '+C', ' ctx'];
    // header(3) + hunkA(4) = 7, +hunkB(4) = 11 → limit 9 면 hunkA 만 담김
    const result = excerptDiff([...header, ...hunkA, ...hunkB, ...hunkC].join('\n'), 9);
    expect(result.truncated).toBe(true);
    expect(result.text).toContain('@@ -1,2 +1,2 @@');
    expect(result.text).not.toContain('@@ -10,2 +10,2 @@');
    // 담긴 hunk 는 완결(내부 절단 없음)
    expect(result.text.endsWith(' ctx')).toBe(true);
  });
});

describe('buildDiffCandidate', () => {
  it('records truncation in note and masks secrets', () => {
    const lines = ['@@ -1 +1 @@', 'password = "hunter2"', ...Array(200).fill('+x')];
    const candidate = buildDiffCandidate(change(), lines.join('\n'), 0);
    expect(candidate.block.note).toMatch(/발췌/);
    expect(candidate.fullDiff).not.toContain('hunter2');
    expect(candidate.block.lang).toBe('ts');
  });

  it('omits note when not truncated', () => {
    const candidate = buildDiffCandidate(change(), '@@ -1 +1 @@\n-a\n+b', 0);
    expect(candidate.block.note).toBeUndefined();
  });
});

describe('rankCandidates', () => {
  it('orders by churn desc, demoted last', () => {
    const make = (path: string, churn: number, demoted?: string): DiffCandidate => ({
      block: { id: path, type: 'diff', title: path, file: path, diff: 'x' },
      fullDiff: 'x',
      churn,
      rank: 0,
      demoted,
    });
    const ranked = rankCandidates([
      make('a', 5),
      make('lock', 999, 'lockfile'),
      make('b', 20),
    ]);
    expect(ranked.map((c) => c.block.file)).toEqual(['b', 'a', 'lock']);
    expect(ranked.map((c) => c.rank)).toEqual([0, 1, 2]);
  });
});
