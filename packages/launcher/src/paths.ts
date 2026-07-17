import { realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const PORT_START = 47738;
export const PORT_COUNT = 64;
export const PORT_END = PORT_START + PORT_COUNT - 1;

export interface ResolvedTarget {
  targetKey: string;
  docsDir: string;
  lockPath: string;
  logPath: string;
  candidatePort: number;
}

export function hashPath(value: string): number {
  let hash = 5381;

  for (const character of value) {
    hash = (hash * 33) ^ character.charCodeAt(0);
  }

  return hash >>> 0;
}

export function viewerPort(targetKey: string): number {
  return PORT_START + (hashPath(targetKey) % PORT_COUNT);
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function canonicalizePath(value: string): string {
  const absolutePath = path.resolve(value);
  const missingSegments: string[] = [];
  let currentPath = absolutePath;

  while (true) {
    try {
      const existingPath = realpathSync(currentPath);
      return path.join(existingPath, ...missingSegments);
    } catch (error) {
      if (!isMissingPathError(error)) {
        return absolutePath;
      }

      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) {
        return absolutePath;
      }

      missingSegments.unshift(path.basename(currentPath));
      currentPath = parentPath;
    }
  }
}

export function lockPath(targetKey: string): string {
  return path.join(os.tmpdir(), `previs-viewer-${hashPath(targetKey)}.lock`);
}

export function logPath(targetKey: string): string {
  return path.join(os.tmpdir(), `previs-viewer-${hashPath(targetKey)}.log`);
}

export function resolveTarget(env: NodeJS.ProcessEnv, projectRoot: string): ResolvedTarget {
  const configuredDocsDir = env.PREVIS_DOCS_DIR?.trim();
  const docsDirInput = configuredDocsDir
    ? path.isAbsolute(configuredDocsDir)
      ? configuredDocsDir
      : path.resolve(projectRoot, configuredDocsDir)
    : path.resolve(projectRoot, '.previs');
  const docsDir = canonicalizePath(docsDirInput);

  return {
    targetKey: docsDir,
    docsDir,
    lockPath: lockPath(docsDir),
    logPath: logPath(docsDir),
    candidatePort: viewerPort(docsDir),
  };
}
