const fallbackLabels: Record<string, string> = {
  diagram: '다이어그램',
  'annotated-code': '주석 코드',
  'data-model': '데이터 모델',
  'api-endpoint': 'API 엔드포인트',
  'question-form': '질문 폼',
};

export function FallbackBlock({ type }: { type: string }) {
  return (
    <section className="rounded-xl border border-dashed border-hairline bg-surface-soft p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {fallbackLabels[type] ?? type}
      </p>
      <p className="mt-2 text-sm text-steel">이 블록은 M3에서 지원됩니다.</p>
    </section>
  );
}
