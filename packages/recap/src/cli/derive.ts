import { pathToFileURL } from 'node:url';

import { deriveManifest, writeManifest, type DeriveOptions } from '../derive.js';
import { createGitRunner } from '../git.js';
import { SourceError } from '../source.js';

interface ParsedArgs {
  options: DeriveOptions;
}

function parseArgs(args: string[]): ParsedArgs | { error: string } {
  const options: Partial<DeriveOptions> = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case '--range':
        options.range = args[(i += 1)];
        break;
      case '--staged':
        options.staged = true;
        break;
      case '--worktree':
        options.worktree = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--out':
        options.out = args[(i += 1)];
        break;
      default:
        return { error: `알 수 없는 인자: ${arg}` };
    }
  }

  if (!options.out) {
    return { error: '--out <manifest-path> 는 필수입니다.' };
  }

  return { options: options as DeriveOptions };
}

const USAGE =
  '사용법: pnpm recap:derive --out <manifest-path> [--range <rev-range> | --staged | --worktree] [--force]';

export function main(args: string[]): number {
  const parsed = parseArgs(args);
  if ('error' in parsed) {
    console.error(parsed.error);
    console.error(USAGE);
    return 1;
  }

  try {
    const git = createGitRunner(process.cwd());
    const result = deriveManifest(git, parsed.options);
    writeManifest(result, parsed.options.out);

    const { manifest } = result;
    if (manifest.errors.length > 0) {
      console.error(`도출 중 ${manifest.errors.length}건의 오류가 발생했습니다:`);
      for (const message of manifest.errors) console.error(`  ${message}`);
      return 2;
    }

    console.error(
      `manifest: ${parsed.options.out} (파일 ${manifest.stats.files}개, +${manifest.stats.insertions} −${manifest.stats.deletions}, diff 후보 ${manifest.diffs.length}개)`,
    );
    if (manifest.skip.recommended) {
      console.error(`skip 권고: ${manifest.skip.reason}`);
    }
    return 0;
  } catch (error) {
    if (error instanceof SourceError) {
      console.error(error.message);
      return 1;
    }
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

const invokedFile = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;

if (invokedFile === import.meta.url) {
  process.exitCode = main(process.argv.slice(2));
}
