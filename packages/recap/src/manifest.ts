import type { FileTreeBlock } from '@previs/schema';

import type { DiffCandidate } from './excerpt.js';
import type { FileChange } from './inventory.js';
import type { DiffSourceResolution } from './source.js';

export interface RecapStats {
  files: number;
  insertions: number;
  deletions: number;
}

export interface RecapSkip {
  recommended: boolean;
  reason?: string;
}

export interface ManifestDiff {
  block: DiffCandidate['block'];
  fullDiffPath: string;
  churn: number;
  rank: number;
  demoted?: string;
}

export interface RecapManifest {
  source: DiffSourceResolution;
  stats: RecapStats;
  skip: RecapSkip;
  fileTree: FileTreeBlock;
  diffs: ManifestDiff[];
  errors: string[];
}

const SKIP_MAX_FILES = 1;
const SKIP_MAX_LINES = 40;

export function computeStats(changes: FileChange[]): RecapStats {
  let insertions = 0;
  let deletions = 0;
  for (const change of changes) {
    insertions += change.insertions;
    deletions += change.deletions;
  }
  return { files: changes.length, insertions, deletions };
}

/** 작고 명백한 단일 파일 diff 는 recap 생략을 권고한다 (콘텐츠 규칙 6). */
export function evaluateSkip(changes: FileChange[], force: boolean): RecapSkip {
  if (force) return { recommended: false };

  const totalLines = changes.reduce((sum, change) => sum + (change.churn ?? 0), 0);
  if (changes.length <= SKIP_MAX_FILES && totalLines <= SKIP_MAX_LINES) {
    return {
      recommended: true,
      reason: `변경 파일 ${changes.length}개, 총 ${totalLines}줄로 작고 명백한 변경입니다. recap 요약이 리뷰 오버헤드일 수 있습니다.`,
    };
  }
  return { recommended: false };
}
