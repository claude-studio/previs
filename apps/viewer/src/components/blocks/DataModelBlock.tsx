import type { DataModelBlock as DataModelBlockData } from '@previs/schema';

import { FieldTable, InferredBadge } from './FieldTable';

export function DataModelBlock({ block }: { block: DataModelBlockData }) {
  const headingId = `data-model-${block.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-5 rounded-xl border border-hairline bg-canvas p-5"
    >
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-card-title font-semibold text-ink" id={headingId}>
          데이터 모델
        </h3>
        <span className="text-xs text-muted">{block.entities.length}개 엔티티</span>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {block.entities.map((entity) => (
          <article
            className="min-w-0 rounded-xl border border-hairline-soft bg-surface p-4"
            key={entity.name}
          >
            <header className="mb-3 flex flex-wrap items-center gap-2">
              <h4 className="font-mono text-sm font-semibold text-ink">{entity.name}</h4>
              {entity.inferred ? <InferredBadge /> : null}
            </header>
            <FieldTable fields={entity.fields} label={`${entity.name} 필드`} />
          </article>
        ))}
      </div>

      {block.relations?.length ? (
        <section aria-labelledby={`${headingId}-relations`} className="space-y-3">
          <h4 className="text-sm font-semibold text-ink" id={`${headingId}-relations`}>
            관계
          </h4>
          <ul className="grid gap-2 text-sm">
            {block.relations.map((relation) => (
              <li
                className="flex flex-wrap items-center gap-2 rounded-lg border border-hairline-soft bg-surface px-3 py-2.5"
                key={`${relation.from}-${relation.to}-${relation.kind}-${relation.label ?? ''}`}
              >
                <code className="font-mono text-xs font-semibold text-ink">{relation.from}</code>
                <span aria-hidden="true" className="text-muted">
                  →
                </span>
                <code className="font-mono text-xs font-semibold text-ink">{relation.to}</code>
                <span className="rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-semibold text-info">
                  {relation.kind}
                </span>
                {relation.label ? (
                  <span className="text-xs text-steel">{relation.label}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
