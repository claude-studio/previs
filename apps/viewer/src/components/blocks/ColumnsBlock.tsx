import type { ColumnsBlock as ColumnsBlockData } from '@previs/schema';

import { BlockRenderer } from './BlockRenderer';

const columnGridClasses = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
} as const;

export function ColumnsBlock({ block }: { block: ColumnsBlockData }) {
  const gridClass = columnGridClasses[block.items.length as 2 | 3 | 4];

  return (
    <section className={`grid grid-cols-1 gap-5 ${gridClass}`}>
      {block.items.map((item, index) => (
        <div
          className="min-w-0 space-y-5 rounded-xl border border-hairline-soft bg-surface p-4"
          key={`column-${index}`}
        >
          {item.blocks.map((child) => (
            <BlockRenderer key={child.id} block={child} />
          ))}
        </div>
      ))}
    </section>
  );
}
