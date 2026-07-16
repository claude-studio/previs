export function FallbackBlock({ type }: { type: string }) {
  return (
    <section className="rounded-xl border border-dashed border-hairline bg-surface-soft p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        지원되지 않는 블록 타입
      </p>
      <p className="mt-2 font-mono text-xs text-steel">{type}</p>
    </section>
  );
}
