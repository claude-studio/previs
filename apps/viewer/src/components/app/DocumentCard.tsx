import { IconArrowUpRight } from '@tabler/icons-react';
import { Link } from 'react-router';

import type { DocumentEntry } from '../../lib/documents';
import { cardIdentity, type CardIdentity } from '../../lib/card-identity';
import { documentRouteKey } from '../../lib/route-key';

const cardClasses: Record<CardIdentity, string> = {
  coral: 'from-brand-coral to-brand-magenta',
  magenta: 'from-brand-magenta to-brand-purple',
  blue: 'from-brand-blue to-brand-blue-mid',
  purple: 'from-brand-purple to-brand-magenta',
  rose: 'from-brand-magenta to-brand-coral',
  violet: 'from-brand-purple to-brand-blue-mid',
  'blue-purple': 'from-brand-blue to-brand-purple',
  'coral-purple': 'from-brand-coral to-brand-purple',
};

const kindLabels = {
  plan: 'PLAN',
  recap: 'RECAP',
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function DocumentCard({ entry }: { entry: DocumentEntry }) {
  const { document } = entry;
  const identity = cardIdentity(document.id);

  return (
    <Link
      className={`group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-hero bg-gradient-to-br p-6 text-on-dark shadow-sm transition-transform hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-canvas ${cardClasses[identity]}`}
      to={`/doc/${documentRouteKey(document.id)}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full bg-black/15 px-3 py-1 text-[11px] font-bold tracking-[0.16em]">
          {kindLabels[document.kind]}
        </span>
        <IconArrowUpRight
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          size={20}
        />
      </div>
      <div>
        <h2 className="max-w-[18rem] text-card-title">{document.title}</h2>
        <p className="mt-3 text-sm text-on-dark/75">
          {formatDate(document.createdAt)} · {document.blocks.length}개 블록
        </p>
      </div>
    </Link>
  );
}
