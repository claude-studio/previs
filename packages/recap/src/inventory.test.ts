import { describe, expect, it } from 'vitest';

import {
  buildFileChanges,
  parseNameStatus,
  parseNumstat,
  toFileTreeBlock,
} from './inventory.js';

describe('parseNameStatus', () => {
  it('parses added/modified/deleted with NUL terminators', () => {
    const raw = 'A\0src/new.ts\0M\0src/app.ts\0D\0src/old.ts\0';
    expect(parseNameStatus(raw)).toEqual([
      { path: 'src/new.ts', status: 'added' },
      { path: 'src/app.ts', status: 'modified' },
      { path: 'src/old.ts', status: 'deleted' },
    ]);
  });

  it('parses rename with score into from/path', () => {
    const raw = 'R096\0src/old-name.ts\0src/new-name.ts\0';
    expect(parseNameStatus(raw)).toEqual([
      { path: 'src/new-name.ts', status: 'renamed', from: 'src/old-name.ts' },
    ]);
  });

  it('handles paths with spaces and unicode', () => {
    const raw = 'M\0docs/한글 파일.md\0';
    expect(parseNameStatus(raw)).toEqual([{ path: 'docs/한글 파일.md', status: 'modified' }]);
  });
});

describe('parseNumstat', () => {
  it('parses added/deleted counts into churn', () => {
    const raw = '10\t4\tsrc/app.ts\0';
    expect(parseNumstat(raw).get('src/app.ts')).toEqual({
      churn: 14,
      insertions: 10,
      deletions: 4,
      binary: false,
    });
  });

  it('marks binary files with null churn', () => {
    const raw = '-\t-\tassets/logo.png\0';
    expect(parseNumstat(raw).get('assets/logo.png')).toEqual({
      churn: null,
      insertions: 0,
      deletions: 0,
      binary: true,
    });
  });

  it('resolves rename path from trailing NUL fields', () => {
    const raw = '3\t1\t\0src/old.ts\0src/new.ts\0';
    expect(parseNumstat(raw).get('src/new.ts')).toEqual({
      churn: 4,
      insertions: 3,
      deletions: 1,
      binary: false,
    });
  });
});

describe('buildFileChanges', () => {
  it('joins name-status with numstat churn', () => {
    const changes = buildFileChanges(
      [{ path: 'src/app.ts', status: 'modified' }],
      new Map([['src/app.ts', { churn: 14, insertions: 10, deletions: 4, binary: false }]]),
    );
    expect(changes).toEqual([
      {
        path: 'src/app.ts',
        status: 'modified',
        from: undefined,
        churn: 14,
        insertions: 10,
        deletions: 4,
        binary: false,
      },
    ]);
  });

  it('appends untracked files as added without duplicating', () => {
    const changes = buildFileChanges(
      [{ path: 'a.ts', status: 'modified' }],
      new Map(),
      ['a.ts', 'b.ts'],
    );
    expect(changes.map((c) => c.path)).toEqual(['a.ts', 'b.ts']);
    expect(changes[1]).toMatchObject({ path: 'b.ts', status: 'added' });
  });
});

describe('toFileTreeBlock', () => {
  it('maps changes to file-tree entries with binary note', () => {
    const block = toFileTreeBlock('ft', [
      { path: 'src/app.ts', status: 'modified', churn: 14, insertions: 10, deletions: 4, binary: false },
      { path: 'logo.png', status: 'added', churn: null, insertions: 0, deletions: 0, binary: true },
      {
        path: 'new.ts',
        status: 'renamed',
        from: 'old.ts',
        churn: 2,
        insertions: 1,
        deletions: 1,
        binary: false,
      },
    ]);
    expect(block).toEqual({
      id: 'ft',
      type: 'file-tree',
      entries: [
        { path: 'src/app.ts', status: 'modified' },
        { path: 'logo.png', status: 'added', note: '바이너리' },
        { path: 'new.ts', status: 'renamed', from: 'old.ts' },
      ],
    });
  });
});
