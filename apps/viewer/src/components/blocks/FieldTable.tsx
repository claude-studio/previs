import type { ApiField, DataModelField } from '@previs/schema';

export type FieldTableField = ApiField | DataModelField;

interface FieldTableProps {
  fields: readonly FieldTableField[];
  label?: string;
  showRequired?: boolean;
}

export function InferredBadge() {
  return (
    <span className="inline-flex rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">
      추론됨
    </span>
  );
}

export function FieldTable({ fields, label = '필드', showRequired = false }: FieldTableProps) {
  const showInferred = fields.some((field) => field.inferred);

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline-soft">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <caption className="sr-only">{label}</caption>
        <thead className="bg-surface text-xs font-semibold text-steel">
          <tr>
            <th className="px-3 py-2.5" scope="col">
              이름
            </th>
            <th className="px-3 py-2.5" scope="col">
              타입
            </th>
            <th className="px-3 py-2.5" scope="col">
              설명
            </th>
            {showRequired ? (
              <th className="px-3 py-2.5" scope="col">
                필수
              </th>
            ) : null}
            {showInferred ? (
              <th className="px-3 py-2.5" scope="col">
                근거
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => {
            const required = 'required' in field ? field.required : undefined;

            return (
              <tr className="border-t border-hairline-soft text-charcoal" key={field.name}>
                <th className="px-3 py-3 font-mono text-xs font-semibold text-ink" scope="row">
                  {field.name}
                </th>
                <td className="px-3 py-3 font-mono text-xs text-steel">{field.type}</td>
                <td className="max-w-72 px-3 py-3 text-xs leading-5 text-steel">
                  {field.note ?? '—'}
                </td>
                {showRequired ? (
                  <td className="whitespace-nowrap px-3 py-3 text-xs">
                    {required ? (
                      <span className="font-semibold text-info">필수</span>
                    ) : (
                      <span className="text-muted">선택</span>
                    )}
                  </td>
                ) : null}
                {showInferred ? (
                  <td className="px-3 py-3">
                    {field.inferred ? (
                      <InferredBadge />
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
