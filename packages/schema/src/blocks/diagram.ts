import { z } from 'zod';

export const diagramSchema = z.object({
  id: z.string().min(1),
  type: z.literal('diagram'),
  engine: z.literal('mermaid'),
  code: z.string().min(1),
  caption: z.string().min(1).optional(),
});

export type DiagramBlock = z.infer<typeof diagramSchema>;
