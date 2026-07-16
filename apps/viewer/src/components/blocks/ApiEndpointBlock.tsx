import type { ApiEndpointBlock as ApiEndpointBlockData, ApiEndpointRequest } from '@previs/schema';

import { FieldTable, InferredBadge } from './FieldTable';

const methodStyles: Record<ApiEndpointBlockData['method'], string> = {
  GET: 'bg-info-soft text-info',
  POST: 'bg-success-soft text-success',
  PUT: 'bg-warning-soft text-warning',
  PATCH: 'bg-brand-purple/15 text-brand-purple',
  DELETE: 'bg-danger-soft text-danger',
};

const requestSections: ReadonlyArray<{
  key: keyof ApiEndpointRequest;
  label: string;
}> = [
  { key: 'params', label: '경로 파라미터' },
  { key: 'query', label: '쿼리' },
  { key: 'body', label: '본문' },
];

export function ApiEndpointBlock({ block }: { block: ApiEndpointBlockData }) {
  const headingId = `api-endpoint-${block.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-xl border border-hairline bg-canvas"
    >
      <header className="border-b border-hairline-soft bg-surface px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md px-2 py-1 font-mono text-xs font-bold ${methodStyles[block.method]}`}
          >
            {block.method}
          </span>
          <code className="break-all font-mono text-sm font-semibold text-ink" id={headingId}>
            {block.path}
          </code>
          {block.inferred ? <InferredBadge /> : null}
        </div>
        {block.summary ? (
          <h3 className="mt-3 text-sm font-semibold text-charcoal">{block.summary}</h3>
        ) : null}
      </header>

      <div className="space-y-5 p-5">
        {block.request ? (
          <section aria-labelledby={`${headingId}-request`} className="space-y-3">
            <h4 className="text-sm font-semibold text-ink" id={`${headingId}-request`}>
              요청
            </h4>
            <div className="space-y-4">
              {requestSections.map((section) => {
                const fields = block.request?.[section.key];

                return fields?.length ? (
                  <div className="space-y-2" key={section.key}>
                    <h5 className="text-xs font-semibold text-steel">{section.label}</h5>
                    <FieldTable fields={fields} label={`요청 ${section.label} 필드`} showRequired />
                  </div>
                ) : null;
              })}
            </div>
          </section>
        ) : null}

        <section aria-labelledby={`${headingId}-responses`} className="space-y-3">
          <h4 className="text-sm font-semibold text-ink" id={`${headingId}-responses`}>
            응답
          </h4>
          <div className="grid gap-3 md:grid-cols-2">
            {block.responses.map((response, index) => (
              <article
                className="rounded-lg border border-hairline-soft bg-surface p-4"
                key={`${response.status}-${index}`}
              >
                <header className="flex flex-wrap items-center gap-2">
                  <code className="rounded-md bg-surface-soft px-2 py-1 font-mono text-xs font-semibold text-ink">
                    {response.status}
                  </code>
                  {response.note ? <p className="text-xs text-steel">{response.note}</p> : null}
                </header>
                {response.body?.length ? (
                  <div className="mt-3">
                    <FieldTable
                      fields={response.body}
                      label={`${response.status} 응답 본문 필드`}
                      showRequired
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
