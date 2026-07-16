import {
  IconFile,
  IconFolder,
  IconFolderOpen,
  type Icon,
} from '@tabler/icons-react';

import type {
  FileTreeBlock as FileTreeBlockData,
  FileTreeEntry,
} from '@previs/schema';

interface TreeNode {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  entry?: FileTreeEntry;
}

function buildTree(entries: FileTreeEntry[]): TreeNode {
  const root: TreeNode = { name: '', path: '', children: new Map() };

  entries.forEach((entry) => {
    let current = root;
    const parts = entry.path.split('/').filter(Boolean);

    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join('/');
      const existing = current.children.get(part);
      const node = existing ?? { name: part, path, children: new Map() };

      current.children.set(part, node);
      current = node;
    });

    current.entry = entry;
  });

  return root;
}

const statusStyles = {
  added: 'text-success',
  modified: 'text-info',
  deleted: 'text-danger',
  renamed: 'text-warning',
} satisfies Record<NonNullable<FileTreeEntry['status']>, string>;

const statusLabels = {
  added: '추가',
  modified: '수정',
  deleted: '삭제',
  renamed: '이름 변경',
} satisfies Record<NonNullable<FileTreeEntry['status']>, string>;

function TreeNodeView({ node, depth }: { node: TreeNode; depth: number }) {
  const children = [...node.children.values()];
  const Icon: Icon = children.length > 0 ? IconFolderOpen : IconFile;
  const entry = node.entry;

  return (
    <li>
      <div
        className="group flex min-h-9 items-start gap-2 rounded-md px-2 py-1.5 hover:bg-surface"
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
      >
        <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-steel" size={16} />
        <span className="min-w-0 flex-1 break-all font-mono text-xs text-charcoal">
          {node.name}
          {entry?.note ? (
            <span className="ml-2 font-sans text-[11px] text-muted">— {entry.note}</span>
          ) : null}
        </span>
        {entry?.status ? (
          <span className={`shrink-0 text-[11px] font-semibold ${statusStyles[entry.status]}`}>
            {statusLabels[entry.status]}
          </span>
        ) : null}
        {entry?.inferred ? (
          <span className="shrink-0 rounded-full bg-surface-soft px-1.5 py-0.5 text-[10px] font-medium text-muted">
            inferred
          </span>
        ) : null}
      </div>
      {entry?.from ? (
        <p className="ml-10 break-all font-mono text-[11px] text-muted">
          ← {entry.from}
        </p>
      ) : null}
      {children.length > 0 ? (
        <ul>
          {children.map((child) => (
            <TreeNodeView key={child.path} depth={depth + 1} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function FileTreeBlock({ block }: { block: FileTreeBlockData }) {
  const tree = buildTree(block.entries);
  const children = [...tree.children.values()];

  return (
    <section className="overflow-hidden rounded-xl border border-hairline bg-canvas">
      <div className="flex items-center gap-2 border-b border-hairline-soft bg-surface px-4 py-3">
        <IconFolder aria-hidden="true" className="text-steel" size={17} />
        <h3 className="text-sm font-semibold text-ink">변경 파일</h3>
        <span className="ml-auto text-xs text-muted">{block.entries.length}개</span>
      </div>
      <ul className="py-2">
        {children.map((child) => (
          <TreeNodeView key={child.path} depth={0} node={child} />
        ))}
      </ul>
    </section>
  );
}
