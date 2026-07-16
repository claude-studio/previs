import { describe, expect, it } from 'vitest';

import { questionFormSchema } from './question-form.js';

describe('questionFormSchema', () => {
  it('accepts questions with options and free text', () => {
    const result = questionFormSchema.safeParse({
      id: 'q1',
      type: 'question-form',
      questions: [
        {
          id: 'q1-1',
          prompt: '어느 저장 모드를 기본으로 할까요?',
          options: [{ label: '로컬' }, { label: 'Supabase', description: '협업 모드' }],
          allowFreeText: true,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty question list', () => {
    const result = questionFormSchema.safeParse({ id: 'q1', type: 'question-form', questions: [] });
    expect(result.success).toBe(false);
  });

  it('rejects an option without label', () => {
    const result = questionFormSchema.safeParse({
      id: 'q1',
      type: 'question-form',
      questions: [{ id: 'q1-1', prompt: '질문', options: [{ description: '설명만' }] }],
    });
    expect(result.success).toBe(false);
  });
});
