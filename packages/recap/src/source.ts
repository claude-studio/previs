import type { GitRunner } from './git.js';

export type DiffMode = 'range' | 'staged' | 'worktree';

export interface DiffSourceResolution {
  mode: DiffMode;
  branch?: string;
  commitRange?: string;
}

export interface SourceOptions {
  range?: string;
  staged?: boolean;
  worktree?: boolean;
}

export class SourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceError';
  }
}

export interface RepoState {
  currentBranch: string | null;
  baseBranch: string | null;
  mergeBase: string | null;
  dirty: boolean;
}

/**
 * base ref 의 short name 에서 원격 접두(`origin/`)를 떼어 현재 브랜치명과
 * 논리적으로 비교한다. `origin/main` 과 `main` 을 문자열 불일치로 오분기하지
 * 않기 위함.
 */
export function logicalBranchName(ref: string | null): string | null {
  if (!ref) return null;
  const short = ref.replace(/^refs\/(heads|remotes)\//, '');
  return short.replace(/^[^/]+\//, '');
}

/** git 조회 결과(RepoState)만으로 auto 모드 소스를 결정하는 순수 함수. */
export function resolveAutoSource(state: RepoState): DiffSourceResolution {
  if (state.dirty) {
    throw new SourceError(
      'auto 모드에서 워킹트리에 커밋되지 않은 변경이 있습니다. --range, --worktree 를 명시하거나 변경을 커밋하세요.',
    );
  }

  const current = state.currentBranch;
  const base = logicalBranchName(state.baseBranch);

  if (current === null) {
    throw new SourceError('현재 브랜치를 확인할 수 없습니다(detached HEAD). --range 를 명시하세요.');
  }

  if (base !== null && current !== base) {
    if (!state.mergeBase) {
      throw new SourceError(
        `${state.baseBranch} 와의 merge-base 를 찾을 수 없습니다. --range 를 명시하세요.`,
      );
    }
    return { mode: 'range', branch: current, commitRange: `${state.mergeBase}..HEAD` };
  }

  throw new SourceError(
    '현재 브랜치가 base 와 같아 비교 범위를 정할 수 없습니다. --range 를 명시하세요.',
  );
}

function detectRepoState(git: GitRunner): RepoState {
  const branchOut = git.run(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
  const currentBranch = branchOut === 'HEAD' || branchOut === '' ? null : branchOut;

  let baseBranch: string | null = null;
  try {
    baseBranch = git.run(['rev-parse', '--abbrev-ref', 'origin/HEAD']).stdout.trim() || null;
  } catch {
    for (const candidate of ['main', 'master']) {
      try {
        git.run(['rev-parse', '--verify', '--quiet', candidate]);
        baseBranch = candidate;
        break;
      } catch {
        continue;
      }
    }
  }

  let mergeBase: string | null = null;
  if (baseBranch && currentBranch && logicalBranchName(baseBranch) !== currentBranch) {
    try {
      mergeBase = git.run(['merge-base', baseBranch, 'HEAD']).stdout.trim() || null;
    } catch {
      mergeBase = null;
    }
  }

  const status = git.run(['status', '--porcelain']).stdout.trim();
  return { currentBranch, baseBranch, mergeBase, dirty: status.length > 0 };
}

export function resolveSource(git: GitRunner, options: SourceOptions): DiffSourceResolution {
  const explicit = [options.range, options.staged, options.worktree].filter(Boolean).length;
  if (explicit > 1) {
    throw new SourceError('--range, --staged, --worktree 중 하나만 지정할 수 있습니다.');
  }

  if (options.range) {
    return { mode: 'range', commitRange: options.range };
  }

  const branch = (() => {
    const out = git.run(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
    return out === 'HEAD' || out === '' ? undefined : out;
  })();

  if (options.staged) {
    return { mode: 'staged', branch };
  }
  if (options.worktree) {
    return { mode: 'worktree', branch };
  }

  return resolveAutoSource(detectRepoState(git));
}
