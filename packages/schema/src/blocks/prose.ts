import { z } from 'zod';

export const proseSchema = z.object({
  id: z.string().min(1),
  type: z.literal('prose'),
  markdown: z.string().min(1),
});

export type ProseBlock = z.infer<typeof proseSchema>;
