import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
  type Icon,
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';

import type { CalloutBlock as CalloutBlockData } from '@previs/schema';

const variants = {
  info: {
    Icon: IconInfoCircle,
    container: 'border-info/25 bg-info-soft',
    icon: 'text-info',
  },
  warning: {
    Icon: IconAlertTriangle,
    container: 'border-warning/30 bg-warning-soft',
    icon: 'text-warning',
  },
  danger: {
    Icon: IconCircleX,
    container: 'border-danger/30 bg-danger-soft',
    icon: 'text-danger',
  },
  success: {
    Icon: IconCircleCheck,
    container: 'border-success/30 bg-success-soft',
    icon: 'text-success',
  },
} satisfies Record<
  CalloutBlockData['variant'],
  { Icon: Icon; container: string; icon: string }
>;

export function CalloutBlock({ block }: { block: CalloutBlockData }) {
  const variant = variants[block.variant];
  const Icon = variant.Icon;

  return (
    <aside className={`rounded-xl border p-5 ${variant.container}`}>
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className={`mt-0.5 shrink-0 ${variant.icon}`} size={20} />
        <div className="min-w-0">
          {block.title ? (
            <h3 className="mb-1 text-sm font-semibold text-ink">{block.title}</h3>
          ) : null}
          <div className="document-markdown text-sm leading-6 text-charcoal">
            <ReactMarkdown>{block.markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </aside>
  );
}
