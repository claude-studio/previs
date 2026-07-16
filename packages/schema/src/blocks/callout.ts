import { z } from 'zod';

export const calloutSchema = z.object({
  id: z.string().min(1),
  type: z.literal('callout'),
  variant: z.enum(['info', 'warning', 'danger', 'success']),
  title: z.string().min(1).optional(),
  markdown: z.string().min(1),
});

export type CalloutBlock = z.infer<typeof calloutSchema>;
