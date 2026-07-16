import { z } from 'zod';

const questionOptionSchema = z.object({
  label: z.string().min(1),
  description: z.string().min(1).optional(),
});

const questionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(questionOptionSchema).min(1).optional(),
  allowFreeText: z.boolean().optional(),
});

export const questionFormSchema = z.object({
  id: z.string().min(1),
  type: z.literal('question-form'),
  questions: z.array(questionSchema).min(1),
});

export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionFormBlock = z.infer<typeof questionFormSchema>;
