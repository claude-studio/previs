import { spawnSync } from 'node:child_process';

export interface GitResult {
  stdout: string;
  status: number;
}

export interface GitRunner {
  run(args: string[]): GitResult;
}

/**
 * git diff --no-index 는 차이를 찾으면 status 1 을 반환한다. 이 경로에서만
 * 1 을 성공으로 취급하고 나머지 명령은 0 만 성공으로 본다.
 */
const DIFF_EXIT_OK = new Set([0, 1]);

export class GitError extends Error {
  constructor(
    readonly args: string[],
    readonly status: number,
    readonly stderr: string,
  ) {
    super(`git ${args.join(' ')} 실패 (exit ${status}): ${stderr.trim()}`);
    this.name = 'GitError';
  }
}

export function createGitRunner(cwd: string): GitRunner {
  return {
    run(args) {
      const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

      if (result.error) {
        throw new GitError(args, result.status ?? -1, result.error.message);
      }

      const status = result.status ?? -1;
      const isDiffNoIndex = args[0] === 'diff' && args.includes('--no-index');
      const ok = isDiffNoIndex ? DIFF_EXIT_OK.has(status) : status === 0;

      if (!ok) {
        throw new GitError(args, status, result.stderr ?? '');
      }

      return { stdout: result.stdout ?? '', status };
    },
  };
}
