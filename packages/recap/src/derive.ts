import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import {
  buildDiffCandidate,
  rankCandidates,
  type DiffCandidate,
} from './excerpt.js';
import type { GitRunner } from './git.js';
import {
  buildFileChanges,
  parseNameStatus,
  parseNumstat,
  toFileTreeBlock,
  type FileChange,
  type NumstatEntry,
} from './inventory.js';
import {
  computeStats,
  evaluateSkip,
  type ManifestDiff,
  type RecapManifest,
} from './manifest.js';
import {
  resolveSource,
  SourceError,
  type DiffSourceResolution,
  type SourceOptions,
} from './source.js';

export interface DeriveOptions extends SourceOptions {
  force?: boolean;
  /** manifest 출력 경로. patch 디렉토리는 이 경로에서 유도된다. */
  out: string;
}

function diffArgsFor(source: DiffSourceResolution): string[] {
  switch (source.mode) {
    case 'range':
      return [source.commitRange!];
    case 'staged':
      return ['--cached'];
    case 'worktree':
      return ['HEAD'];
  }
}

function syntheticNumstat(git: GitRunner, path: string): Map<string, NumstatEntry> {
  const raw = git.run(['diff', '--no-index', '--numstat', '-z', '--', '/dev/null', path]).stdout;
  return parseNumstat(raw);
}

interface CollectedChanges {
  changes: FileChange[];
  untracked: Set<string>;
}

function collectFileChanges(git: GitRunner, source: DiffSourceResolution): CollectedChanges {
  const scope = diffArgsFor(source);
  const nameStatus = parseNameStatus(git.run(['diff', '--name-status', '-M', '-z', ...scope]).stdout);
  const numstat = parseNumstat(git.run(['diff', '--numstat', '-z', ...scope]).stdout);

  const untracked = new Set<string>();
  if (source.mode === 'worktree') {
    const raw = git.run(['ls-files', '--others', '--exclude-standard', '-z']).stdout;
    for (const path of raw.split('\0').filter((p) => p.length > 0)) {
      untracked.add(path);
      for (const [, entry] of syntheticNumstat(git, path)) {
        numstat.set(path, entry);
      }
    }
  }

  return { changes: buildFileChanges(nameStatus, numstat, [...untracked]), untracked };
}

function rawDiffForFile(
  git: GitRunner,
  source: DiffSourceResolution,
  change: FileChange,
  untracked: Set<string>,
): string {
  if (untracked.has(change.path)) {
    return git.run(['diff', '--no-index', '--', '/dev/null', change.path]).stdout;
  }
  return git.run(['diff', ...diffArgsFor(source), '--', change.path]).stdout;
}

export interface DeriveResult {
  manifest: RecapManifest;
  /** rank 순으로 정렬된 후보. manifest.diffs 와 인덱스가 일치한다. */
  ranked: DiffCandidate[];
}

export function deriveManifest(git: GitRunner, options: DeriveOptions): DeriveResult {
  const source = resolveSource(git, options);
  const { changes, untracked } = collectFileChanges(git, source);

  if (changes.length === 0) {
    throw new SourceError('변경이 없습니다. 다른 범위를 지정하세요.');
  }

  const errors: string[] = [];
  const candidates: DiffCandidate[] = [];

  changes.forEach((change, index) => {
    if (change.binary) return;
    try {
      const raw = rawDiffForFile(git, source, change, untracked);
      if (raw.trim().length === 0) return;
      candidates.push(buildDiffCandidate(change, raw, index));
    } catch (error) {
      errors.push(`${change.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  const ranked = rankCandidates(candidates);
  const stats = computeStats(changes);
  const skip = evaluateSkip(changes, options.force ?? false);
  const fileTree = toFileTreeBlock('recap-file-tree', changes);

  const patchesDir = `${basename(options.out)}.patches`;
  const diffs: ManifestDiff[] = ranked.map((candidate) => {
    const fileName = `${String(candidate.rank).padStart(3, '0')}-${basename(candidate.block.file)}.patch`;
    return {
      block: candidate.block,
      fullDiffPath: join(patchesDir, fileName),
      churn: candidate.churn,
      rank: candidate.rank,
      demoted: candidate.demoted,
    };
  });

  return { manifest: { source, stats, skip, fileTree, diffs, errors }, ranked };
}

/** manifest 를 --out 에 기록하고 out-of-line patch 파일을 함께 쓴다. */
export function writeManifest(result: DeriveResult, outPath: string): void {
  const { manifest, ranked } = result;
  const patchesDir = `${outPath}.patches`;
  mkdirSync(dirname(outPath), { recursive: true });

  if (ranked.length > 0) {
    mkdirSync(patchesDir, { recursive: true });
    manifest.diffs.forEach((diff, index) => {
      writeFileSync(join(patchesDir, basename(diff.fullDiffPath)), ranked[index].fullDiff, 'utf8');
    });
  }

  writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}
