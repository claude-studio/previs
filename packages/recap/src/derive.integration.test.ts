import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { safeParsePrevisDocument } from '@previs/schema';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { deriveManifest, writeManifest } from './derive.js';
import { createGitRunner } from './git.js';

let repo: string;

function git(args: string[]): void {
  execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
}

function write(relative: string, content: string): void {
  const target = join(repo, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, 'utf8');
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'recap-it-'));
  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.email', 'test@example.com']);
  git(['config', 'user.name', 'Test']);
  write('README.md', '# repo\n');
  git(['add', '.']);
  git(['commit', '-q', '-m', 'init']);
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe('deriveManifest (integration)', () => {
  it('derives file-tree and diff blocks that pass schema validation', () => {
    git(['checkout', '-q', '-b', 'feat/work']);
    write('src/app.ts', 'export const x = 1;\nexport const y = 2;\n');
    write('src/util.ts', 'export const z = 3;\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'add source']);

    const runner = createGitRunner(repo);
    const out = join(repo, 'manifest.json');
    const result = deriveManifest(runner, { out });

    expect(result.manifest.source.mode).toBe('range');
    expect(result.manifest.fileTree.entries.map((e) => e.path).sort()).toEqual([
      'src/app.ts',
      'src/util.ts',
    ]);
    expect(result.manifest.diffs.length).toBe(2);
    expect(result.manifest.errors).toEqual([]);

    const document = {
      schemaVersion: 1 as const,
      id: 'recap-test',
      kind: 'recap' as const,
      title: '통합 테스트 recap',
      createdAt: '2026-07-17T00:00:00Z',
      source: result.manifest.source,
      blocks: [result.manifest.fileTree, ...result.manifest.diffs.map((d) => d.block)],
    };
    expect(safeParsePrevisDocument(document).success).toBe(true);
  });

  it('includes untracked files in worktree mode via synthetic patch', () => {
    write('src/brand-new.ts', 'export const fresh = true;\n');

    const runner = createGitRunner(repo);
    const out = join(repo, 'manifest.json');
    const result = deriveManifest(runner, { out, worktree: true });

    const paths = result.manifest.fileTree.entries.map((e) => e.path);
    expect(paths).toContain('src/brand-new.ts');
    const untrackedDiff = result.manifest.diffs.find((d) => d.block.file === 'src/brand-new.ts');
    expect(untrackedDiff).toBeDefined();
    expect(result.manifest.errors).toEqual([]);
  });

  it('writes out-of-line masked patch files', () => {
    git(['checkout', '-q', '-b', 'feat/secret']);
    write('config.ts', 'export const apiKey = "sk-abcdef1234567890";\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'add config']);

    const runner = createGitRunner(repo);
    const out = join(repo, 'manifest.json');
    const result = deriveManifest(runner, { out });
    writeManifest(result, out);

    const diff = result.manifest.diffs[0];
    const patchPath = join(repo, diff.fullDiffPath);
    const patch = readFileSync(patchPath, 'utf8');
    expect(patch).toContain('<redacted>');
    expect(patch).not.toContain('abcdef1234567890');
  });

  it('includes deleted files as diff candidates', () => {
    git(['checkout', '-q', '-b', 'feat/del']);
    write('src/gone.ts', 'export const gone = 1;\nexport const also = 2;\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'add file to delete']);
    execFileSync('git', ['rm', '-q', 'src/gone.ts'], { cwd: repo, stdio: 'pipe' });
    write('src/kept.ts', 'export const kept = 1;\nexport const more = 2;\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'delete gone, add kept']);

    const runner = createGitRunner(repo);
    const result = deriveManifest(runner, { out: join(repo, 'm.json'), range: 'HEAD~1..HEAD' });
    const deleted = result.manifest.diffs.find((d) => d.block.file === 'src/gone.ts');
    expect(deleted).toBeDefined();
  });

  it('includes untracked churn in stats and skip decision', () => {
    // untracked 파일 하나가 churn 을 얻어 skip 임계를 넘는지 확인
    write('big.ts', Array.from({ length: 60 }, (_, i) => `export const v${i} = ${i};`).join('\n'));

    const runner = createGitRunner(repo);
    const result = deriveManifest(runner, { out: join(repo, 'm.json'), worktree: true });
    expect(result.manifest.stats.insertions).toBeGreaterThan(40);
    expect(result.manifest.skip.recommended).toBe(false);
  });

  it('throws on an empty diff range', () => {
    const runner = createGitRunner(repo);
    expect(() => deriveManifest(runner, { out: join(repo, 'm.json'), range: 'HEAD..HEAD' })).toThrow(
      /변경이 없습니다/,
    );
  });

  it('recommends skip for a single tiny change', () => {
    git(['checkout', '-q', '-b', 'feat/tiny']);
    write('README.md', '# repo\nsmall line\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'tiny']);

    const runner = createGitRunner(repo);
    const result = deriveManifest(runner, { out: join(repo, 'm.json') });
    expect(result.manifest.skip.recommended).toBe(true);
  });
});
