import { IconArrowLeft, IconFileText } from '@tabler/icons-react';
import { Link, Navigate, useParams } from 'react-router';

import type { DocumentEntry } from '../../lib/documents';
import { documentRouteKey } from '../../lib/route-key';
import { ThemeToggle } from './ThemeToggle';
import { BlockRenderer } from '../blocks/BlockRenderer';

const kindLabels = {
  plan: 'PLAN',
  recap: 'RECAP',
} as const;

const originLabels = {
  builtin: '내장 픽스처',
  opened: '열린 파일',
  published: '발행 문서',
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function DocumentView({ documents }: { documents: DocumentEntry[] }) {
  const { id: routeKey } = useParams();
  const entry = documents.find(({ document }) => documentRouteKey(document.id) === routeKey);

  if (!entry) {
    return <Navigate replace to="/" />;
  }

  const { document } = entry;

  return (
    <main className="min-h-screen bg-canvas text-ink transition-colors">
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
        <header className="mb-12 flex items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-medium text-steel transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            to="/"
          >
            <IconArrowLeft aria-hidden="true" size={17} />
            문서 목록
          </Link>
          <ThemeToggle />
        </header>

        <article className="mx-auto max-w-[45rem]">
          <header className="mb-12 border-b border-hairline-soft pb-8">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-on-primary">
                {kindLabels[document.kind]}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <IconFileText aria-hidden="true" size={15} />
                {originLabels[entry.origin]}
              </span>
            </div>
            <h1 className="text-heading-lg font-semibold tracking-tight text-ink">
              {document.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-steel">
              <span>{formatDate(document.createdAt)}</span>
              <span>{document.blocks.length}개 블록</span>
              {document.source?.branch ? <span>{document.source.branch}</span> : null}
              {document.source?.commitRange ? (
                <code className="font-mono text-xs">{document.source.commitRange}</code>
              ) : null}
            </div>
          </header>

          <div className="space-y-8">
            {document.blocks.map((block) => (
              <BlockRenderer block={block} key={block.id} />
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
