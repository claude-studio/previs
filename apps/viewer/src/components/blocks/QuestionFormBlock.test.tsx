import type { QuestionFormBlock as QuestionFormBlockData } from '@previs/schema';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QuestionFormBlock } from './QuestionFormBlock';

function questionFormBlock(
  overrides: Partial<QuestionFormBlockData> = {},
): QuestionFormBlockData {
  return {
    id: 'qf-test',
    type: 'question-form',
    questions: [
      {
        id: 'approval',
        prompt: '계획을 승인할까요?',
        options: [
          { label: '승인', description: '다음 단계로 진행합니다.' },
          { label: '수정 요청' },
        ],
        allowFreeText: true,
      },
      { id: 'scope', prompt: '범위는 적절한가요?' },
    ],
    ...overrides,
  };
}

describe('QuestionFormBlock', () => {
  it('renders prompts with their options and descriptions', () => {
    render(<QuestionFormBlock block={questionFormBlock()} />);

    expect(screen.getByText('계획을 승인할까요?')).toBeInTheDocument();
    expect(screen.getByText('승인')).toBeInTheDocument();
    expect(screen.getByText('다음 단계로 진행합니다.')).toBeInTheDocument();
    expect(screen.getByText('범위는 적절한가요?')).toBeInTheDocument();
  });

  it('shows the free-text badge only for questions that allow it', () => {
    render(<QuestionFormBlock block={questionFormBlock()} />);

    expect(screen.getAllByText('자유 입력 허용')).toHaveLength(1);
  });

  it('stays read-only without any form controls', () => {
    render(<QuestionFormBlock block={questionFormBlock()} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('응답 수집은 협업 모드(M6)에서 지원됩니다.')).toBeInTheDocument();
  });
});
