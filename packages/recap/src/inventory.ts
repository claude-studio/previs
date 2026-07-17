import type { FileTreeBlock, FileTreeEntry } from '@previs/schema';

export type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed';

export interface FileChange {
  path: string;
  status: FileStatus;
  from?: string;
  /** 추가+삭제 라인 합. 바이너리는 null. */
  churn: number | null;
  insertions: number;
  deletions: number;
  binary: boolean;
}

const STATUS_MAP: Record<string, FileStatus> = {
  A: 'added',
  M: 'modified',
  D: 'deleted',
  R: 'renamed',
  C: 'added',
};

/**
 * `git diff --name-status -M -z` 출력을 파싱한다. -z 는 각 필드를 NUL 로
 * 구분하며, rename/copy(R/C)는 상태 뒤에 old·new 두 경로 필드가 이어진다.
 */
export function parseNameStatus(raw: string): { path: string; status: FileStatus; from?: string }[] {
  const fields = raw.split('\0').filter((field) => field.length > 0);
  const out: { path: string; status: FileStatus; from?: string }[] = [];

  for (let i = 0; i < fields.length; ) {
    const code = fields[i];
    const letter = code[0];
    const status = STATUS_MAP[letter];
    if (!status) {
      i += 1;
      continue;
    }

    if (letter === 'R' || letter === 'C') {
      const from = fields[i + 1];
      const to = fields[i + 2];
      out.push({ path: to, status, from });
      i += 3;
    } else {
      out.push({ path: fields[i + 1], status });
      i += 2;
    }
  }

  return out;
}

/**
 * `git diff --numstat -z` 출력을 파싱한다. 각 레코드는
 * `<added>\t<deleted>\t<path>` 이며 바이너리는 `-\t-`. rename 은 path 자리에
 * old·new 두 NUL 필드가 이어진다.
 */
export interface NumstatEntry {
  churn: number | null;
  insertions: number;
  deletions: number;
  binary: boolean;
}

export function parseNumstat(raw: string): Map<string, NumstatEntry> {
  const fields = raw.split('\0');
  const map = new Map<string, NumstatEntry>();

  for (let i = 0; i < fields.length; ) {
    const record = fields[i];
    if (!record || !record.includes('\t')) {
      i += 1;
      continue;
    }

    const [addedStr, deletedStr, inlinePath] = record.split('\t');
    let path = inlinePath;
    let consumed = 1;

    if (path === '') {
      // rename: 다음 두 필드가 old, new 경로
      path = fields[i + 2] ?? fields[i + 1] ?? '';
      consumed = 3;
    }

    const binary = addedStr === '-' || deletedStr === '-';
    const insertions = binary ? 0 : Number(addedStr);
    const deletions = binary ? 0 : Number(deletedStr);
    const churn = binary ? null : insertions + deletions;
    if (path) {
      map.set(path, { churn, insertions, deletions, binary });
    }
    i += consumed;
  }

  return map;
}

const ZERO_STAT: NumstatEntry = { churn: 0, insertions: 0, deletions: 0, binary: false };

export function buildFileChanges(
  nameStatus: { path: string; status: FileStatus; from?: string }[],
  numstat: Map<string, NumstatEntry>,
  untracked: string[] = [],
): FileChange[] {
  const changes: FileChange[] = nameStatus.map((entry) => {
    const stat = numstat.get(entry.path) ?? ZERO_STAT;
    return {
      path: entry.path,
      status: entry.status,
      from: entry.from,
      churn: stat.churn,
      insertions: stat.insertions,
      deletions: stat.deletions,
      binary: stat.binary,
    };
  });

  const seen = new Set(changes.map((change) => change.path));
  for (const path of untracked) {
    if (seen.has(path)) continue;
    const stat = numstat.get(path) ?? ZERO_STAT;
    changes.push({
      path,
      status: 'added',
      churn: stat.churn,
      insertions: stat.insertions,
      deletions: stat.deletions,
      binary: stat.binary,
    });
  }

  return changes;
}

export function toFileTreeBlock(id: string, changes: FileChange[]): FileTreeBlock {
  const entries: FileTreeEntry[] = changes.map((change) => {
    const entry: FileTreeEntry = { path: change.path, status: change.status };
    if (change.from) entry.from = change.from;
    if (change.binary) entry.note = '바이너리';
    return entry;
  });

  return { id, type: 'file-tree', entries };
}
