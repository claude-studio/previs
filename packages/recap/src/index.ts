export { deriveManifest, writeManifest, type DeriveOptions, type DeriveResult } from './derive.js';
export { createGitRunner, GitError, type GitRunner, type GitResult } from './git.js';
export {
  buildFileChanges,
  parseNameStatus,
  parseNumstat,
  toFileTreeBlock,
  type FileChange,
  type FileStatus,
  type NumstatEntry,
} from './inventory.js';
export {
  buildDiffCandidate,
  excerptDiff,
  langForPath,
  rankCandidates,
  type DiffCandidate,
} from './excerpt.js';
export { isEnvPath, maskDiff } from './masking.js';
export {
  computeStats,
  evaluateSkip,
  type ManifestDiff,
  type RecapManifest,
  type RecapSkip,
  type RecapStats,
} from './manifest.js';
export {
  resolveSource,
  resolveAutoSource,
  logicalBranchName,
  SourceError,
  type DiffMode,
  type DiffSourceResolution,
  type RepoState,
  type SourceOptions,
} from './source.js';
