import { describe, expect, it } from 'vitest';

import {
  logicalBranchName,
  resolveAutoSource,
  SourceError,
  type RepoState,
} from './source.js';

const base = (overrides: Partial<RepoState> = {}): RepoState => ({
  currentBranch: 'feat/foo',
  baseBranch: 'origin/main',
  mergeBase: 'abc123',
  dirty: false,
  ...overrides,
});

describe('logicalBranchName', () => {
  it('strips remote prefix from origin/main', () => {
    expect(logicalBranchName('origin/main')).toBe('main');
  });

  it('strips refs/heads and refs/remotes prefixes', () => {
    expect(logicalBranchName('refs/heads/main')).toBe('main');
    expect(logicalBranchName('refs/remotes/origin/main')).toBe('main');
  });

  it('keeps a plain branch name', () => {
    expect(logicalBranchName('main')).toBe('main');
  });

  it('returns null for null', () => {
    expect(logicalBranchName(null)).toBeNull();
  });
});

describe('resolveAutoSource', () => {
  it('uses merge-base..HEAD on a feature branch', () => {
    expect(resolveAutoSource(base())).toEqual({
      mode: 'range',
      branch: 'feat/foo',
      commitRange: 'abc123..HEAD',
    });
  });

  it('treats origin/main and main as the same base', () => {
    const state = base({ currentBranch: 'main', baseBranch: 'origin/main' });
    expect(() => resolveAutoSource(state)).toThrow(SourceError);
  });

  it('rejects a dirty working tree', () => {
    expect(() => resolveAutoSource(base({ dirty: true }))).toThrow(/커밋되지 않은 변경/);
  });

  it('rejects detached HEAD', () => {
    expect(() => resolveAutoSource(base({ currentBranch: null }))).toThrow(/detached HEAD/);
  });

  it('rejects when merge-base is missing on a feature branch', () => {
    expect(() => resolveAutoSource(base({ mergeBase: null }))).toThrow(/merge-base/);
  });

  it('rejects when on the base branch itself', () => {
    const state = base({ currentBranch: 'main', baseBranch: 'main', mergeBase: null });
    expect(() => resolveAutoSource(state)).toThrow(/base 와 같아/);
  });
});
