import type { DiffBlock } from '@previs/schema';

import type { FileChange } from './inventory.js';
import { maskDiff } from './masking.js';

const MAX_EXCERPT_LINES = 148;
const MAX_TITLE_LENGTH = 70;

const LANG_BY_EXT: Record<string, string> = {
  ts: 'ts',
  tsx: 'tsx',
  js: 'js',
  jsx: 'jsx',
  mjs: 'js',
  cjs: 'js',
  json: 'json',
  md: 'markdown',
  css: 'css',
  scss: 'scss',
  html: 'html',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'bash',
  py: 'python',
  go: 'go',
  rs: 'rust',
  sql: 'sql',
};

/** dist/·lockfile 등 생성물·잠금파일은 랭킹에서 최하위로 강등한다. */
const DEMOTE_PATTERNS: { test: RegExp; reason: string }[] = [
  { test: /(^|\/)pnpm-lock\.yaml$/, reason: 'lockfile' },
  { test: /(^|\/)package-lock\.json$/, reason: 'lockfile' },
  { test: /(^|\/)yarn\.lock$/, reason: 'lockfile' },
  { test: /(^|\/)dist\//, reason: '생성물' },
  { test: /(^|\/)build\//, reason: '생성물' },
  { test: /\.min\.(js|css)$/, reason: '생성물' },
];

export function langForPath(path: string): string | undefined {
  const ext = path.includes('.') ? path.split('.').pop()!.toLowerCase() : '';
  return LANG_BY_EXT[ext];
}

export function demotionReason(path: string): string | undefined {
  return DEMOTE_PATTERNS.find((pattern) => pattern.test.test(path))?.reason;
}

export function buildTitle(change: FileChange): string {
  const suffix = change.binary
    ? ' (바이너리)'
    : ` (+${change.insertions} −${change.deletions})`;
  const base = `${change.path}${suffix}`;
  if (base.length <= MAX_TITLE_LENGTH) return base;

  const room = MAX_TITLE_LENGTH - suffix.length - 1;
  return `…${change.path.slice(change.path.length - room)}${suffix}`;
}

interface ExcerptResult {
  text: string;
  truncated: boolean;
  totalLines: number;
}

/**
 * unified diff 를 hunk 경계 우선으로 절단한다. 파일 헤더 + 완결된 hunk 를
 * 최대한 담되, 다음 hunk 를 넣으면 한도를 넘으면 그 앞에서 멈춘다. 첫 hunk
 * 부터 한도를 넘으면 hunk 내부를 절단한다.
 */
export function excerptDiff(fullDiff: string, maxLines = MAX_EXCERPT_LINES): ExcerptResult {
  const lines = fullDiff.split('\n');
  if (lines.length <= maxLines) {
    return { text: fullDiff, truncated: false, totalLines: lines.length };
  }

  const firstHunk = lines.findIndex((line) => line.startsWith('@@'));
  const header = firstHunk >= 0 ? lines.slice(0, firstHunk) : [];

  // hunk 단위로 분할
  const hunks: string[][] = [];
  for (let i = firstHunk >= 0 ? firstHunk : lines.length; i < lines.length; i += 1) {
    if (lines[i].startsWith('@@')) {
      hunks.push([lines[i]]);
    } else if (hunks.length > 0) {
      hunks[hunks.length - 1].push(lines[i]);
    }
  }

  const kept: string[] = [...header];
  for (const hunk of hunks) {
    if (kept.length + hunk.length > maxLines) {
      if (kept.length === header.length) {
        // 첫 hunk 가 이미 한도 초과 → 내부 절단
        kept.push(...hunk.slice(0, Math.max(0, maxLines - kept.length)));
      }
      break;
    }
    kept.push(...hunk);
  }

  return { text: kept.join('\n'), truncated: true, totalLines: lines.length };
}

export interface DiffCandidate {
  block: DiffBlock;
  fullDiff: string;
  churn: number;
  rank: number;
  demoted?: string;
}

export function buildDiffCandidate(
  change: FileChange,
  rawFileDiff: string,
  index: number,
): DiffCandidate {
  const maskedFull = maskDiff(rawFileDiff, change.path);
  const excerpt = excerptDiff(maskedFull);

  const noteParts: string[] = [];
  if (excerpt.truncated) {
    noteParts.push(`전체 diff ${excerpt.totalLines}줄 중 ${excerpt.text.split('\n').length}줄 발췌`);
  }
  const demoted = demotionReason(change.path);

  const block: DiffBlock = {
    id: `recap-diff-${index}`,
    type: 'diff',
    title: buildTitle(change),
    file: change.path,
    diff: excerpt.text,
  };
  const lang = langForPath(change.path);
  if (lang) block.lang = lang;
  if (noteParts.length > 0) block.note = noteParts.join(' · ');

  return {
    block,
    fullDiff: maskedFull,
    churn: change.churn ?? 0,
    rank: index,
    demoted,
  };
}

/** churn 내림차순, 강등 항목은 뒤로. */
export function rankCandidates(candidates: DiffCandidate[]): DiffCandidate[] {
  const sorted = [...candidates].sort((a, b) => {
    const aDemoted = a.demoted ? 1 : 0;
    const bDemoted = b.demoted ? 1 : 0;
    if (aDemoted !== bDemoted) return aDemoted - bDemoted;
    return b.churn - a.churn;
  });
  return sorted.map((candidate, rank) => ({ ...candidate, rank }));
}
