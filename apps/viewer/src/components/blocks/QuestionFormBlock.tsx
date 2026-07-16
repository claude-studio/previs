import type { QuestionFormBlock as QuestionFormBlockData } from '@previs/schema';

export function QuestionFormBlock({ block }: { block: QuestionFormBlockData }) {
  const headingId = `question-form-${block.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-5 rounded-xl border border-hairline bg-canvas p-5"
    >
      <header>
        <h3 className="text-card-title font-semibold text-ink" id={headingId}>
          미해결 질문
        </h3>
        <p className="mt-1 text-sm text-steel">검토자가 답변 방향을 확인할 질문 목록입니다.</p>
      </header>

      <ol className="space-y-4">
        {block.questions.map((question, index) => (
          <li className="rounded-xl border border-hairline-soft bg-surface p-4" key={question.id}>
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary"
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold leading-6 text-ink">{question.prompt}</h4>
                  {question.allowFreeText ? (
                    <span className="rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-semibold text-info">
                      자유 입력 허용
                    </span>
                  ) : null}
                </div>

                {question.options?.length ? (
                  <ul className="mt-3 space-y-2 border-l-2 border-hairline pl-4">
                    {question.options.map((option) => (
                      <li key={option.label}>
                        <p className="text-sm font-medium text-charcoal">{option.label}</p>
                        {option.description ? (
                          <p className="mt-0.5 text-xs leading-5 text-steel">
                            {option.description}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <footer className="border-t border-hairline-soft pt-4 text-xs leading-5 text-muted">
        응답 수집은 협업 모드(M6)에서 지원됩니다.
      </footer>
    </section>
  );
}
