import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  PORT_COUNT,
  PORT_END,
  PORT_START,
  hashPath,
  lockPath,
  logPath,
  resolveTarget,
  viewerPort,
} from './paths.js';

const tempDirs: string[] = [];

function makeTempRoot(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'previs-paths-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe('hashPath', () => {
  it('is deterministic for the same input', () => {
    expect(hashPath('/a/b/c')).toBe(hashPath('/a/b/c'));
  });

  it('differs for different inputs', () => {
    expect(hashPath('/a/b/c')).not.toBe(hashPath('/a/b/d'));
  });
});

describe('viewerPort', () => {
  it('stays inside the dedicated band', () => {
    for (const key of ['/x', '/y/z', '/some/deep/path/.previs', 'previs']) {
      const port = viewerPort(key);
      expect(port).toBeGreaterThanOrEqual(PORT_START);
      expect(port).toBeLessThanOrEqual(PORT_END);
    }
    expect(PORT_END).toBe(PORT_START + PORT_COUNT - 1);
  });
});

describe('resolveTarget', () => {
  it('defaults docsDir to <projectRoot>/.previs and uses it as targetKey', () => {
    const root = makeTempRoot();
    const target = resolveTarget({}, root);

    expect(path.isAbsolute(target.docsDir)).toBe(true);
    expect(path.basename(target.docsDir)).toBe('.previs');
    expect(target.targetKey).toBe(target.docsDir);
    expect(target.candidatePort).toBe(viewerPort(target.docsDir));
  });

  it('does not throw when .previs does not exist yet', () => {
    const root = makeTempRoot();
    expect(() => resolveTarget({}, root)).not.toThrow();
  });

  it('honors an absolute PREVIS_DOCS_DIR override', () => {
    const root = makeTempRoot();
    const other = makeTempRoot();
    const target = resolveTarget({ PREVIS_DOCS_DIR: other }, root);

    expect(target.docsDir).toBe(realpathSync(other));
    expect(target.docsDir.includes(path.basename(root))).toBe(false);
  });

  it('resolves a relative PREVIS_DOCS_DIR against projectRoot', () => {
    const root = makeTempRoot();
    const target = resolveTarget({ PREVIS_DOCS_DIR: 'sub/docs' }, root);

    expect(path.isAbsolute(target.docsDir)).toBe(true);
    expect(target.docsDir.endsWith(path.join('sub', 'docs'))).toBe(true);
  });

  it('derives lock and log paths inside the OS temp dir', () => {
    const root = makeTempRoot();
    const target = resolveTarget({}, root);

    expect(target.lockPath).toBe(lockPath(target.docsDir));
    expect(target.logPath).toBe(logPath(target.docsDir));
    expect(target.lockPath.startsWith(os.tmpdir())).toBe(true);
    expect(target.lockPath).not.toBe(target.logPath);
  });
});
