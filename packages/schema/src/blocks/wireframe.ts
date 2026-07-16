import { z } from 'zod';

export const wireframeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('wireframe'),
  surface: z.enum(['browser', 'desktop', 'mobile', 'popover', 'panel']),
  title: z.string().min(1).optional(),
  html: z.string().min(1),
});

export type WireframeBlock = z.infer<typeof wireframeSchema>;
