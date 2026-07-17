import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './derive.js';

let repo: string;
let cwdSpy: ReturnType<typeof vi.spyOn>;

function git(args: string[]): void {
  execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'recap-cli-'));
  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.email', 'test@example.com']);
  git(['config', 'user.name', 'Test']);
  writeFileSync(join(repo, 'README.md'), '# repo\n');
  git(['add', '.']);
  git(['commit', '-q', '-m', 'init']);
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(repo);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  cwdSpy.mockRestore();
  vi.restoreAllMocks();
  rmSync(repo, { recursive: true, force: true });
});

describe('cli main', () => {
  it('exits 1 without --out', () => {
    expect(main([])).toBe(1);
  });

  it('exits 1 on unknown argument', () => {
    expect(main(['--out', join(repo, 'm.json'), '--nope'])).toBe(1);
  });

  it('exits 1 on source error (on base branch, clean tree)', () => {
    expect(main(['--out', join(repo, 'm.json')])).toBe(1);
  });

  it('exits 0 on a valid range derivation', () => {
    git(['checkout', '-q', '-b', 'feat/x']);
    writeFileSync(join(repo, 'a.ts'), 'export const a = 1;\nexport const b = 2;\n');
    writeFileSync(join(repo, 'c.ts'), 'export const c = 3;\nexport const d = 4;\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'work']);
    expect(main(['--out', join(repo, 'm.json'), '--range', 'main..HEAD'])).toBe(0);
  });
});
