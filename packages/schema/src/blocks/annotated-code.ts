import { z } from 'zod';

const annotationSchema = z.object({
  line: z.number().int().positive(),
  markdown: z.string().min(1),
});

export const annotatedCodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal('annotated-code'),
    file: z.string().min(1).optional(),
    lang: z.string().min(1),
    code: z.string().min(1),
    startLine: z.number().int().positive().optional(),
    annotations: z.array(annotationSchema),
  })
  .superRefine((block, context) => {
    const lineCount = block.code.split('\n').length;

    block.annotations.forEach((annotation, index) => {
      if (annotation.line > lineCount) {
        context.addIssue({
          code: 'custom',
          path: ['annotations', index, 'line'],
          message: `line must be between 1 and ${lineCount}`,
        });
      }
    });
  });

export type AnnotatedCodeAnnotation = z.infer<typeof annotationSchema>;
export type AnnotatedCodeBlock = z.infer<typeof annotatedCodeSchema>;
