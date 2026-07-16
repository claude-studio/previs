import { z } from 'zod';

const fileTreeEntrySchema = z.object({
  path: z.string().min(1),
  status: z.enum(['added', 'modified', 'deleted', 'renamed']).optional(),
  from: z.string().min(1).optional(),
  note: z.string().min(1).optional(),
  inferred: z.boolean().optional(),
});

export const fileTreeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('file-tree'),
  entries: z.array(fileTreeEntrySchema).min(1),
});

export type FileTreeEntry = z.infer<typeof fileTreeEntrySchema>;
export type FileTreeBlock = z.infer<typeof fileTreeSchema>;
