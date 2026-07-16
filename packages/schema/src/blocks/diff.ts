import { z } from 'zod';

export const diffSchema = z.object({
  id: z.string().min(1),
  type: z.literal('diff'),
  title: z.string().min(1),
  file: z.string().min(1),
  lang: z.string().min(1).optional(),
  diff: z.string().min(1),
  note: z.string().min(1).optional(),
});

export type DiffBlock = z.infer<typeof diffSchema>;
