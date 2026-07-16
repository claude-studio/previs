import { z } from 'zod';

const dataModelFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  note: z.string().min(1).optional(),
  inferred: z.boolean().optional(),
});

const dataModelEntitySchema = z.object({
  name: z.string().min(1),
  fields: z.array(dataModelFieldSchema).min(1),
  inferred: z.boolean().optional(),
});

const dataModelRelationSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  kind: z.enum(['1-1', '1-n', 'n-m']),
  label: z.string().min(1).optional(),
});

export const dataModelSchema = z.object({
  id: z.string().min(1),
  type: z.literal('data-model'),
  entities: z.array(dataModelEntitySchema).min(1),
  relations: z.array(dataModelRelationSchema).optional(),
});

export type DataModelField = z.infer<typeof dataModelFieldSchema>;
export type DataModelEntity = z.infer<typeof dataModelEntitySchema>;
export type DataModelRelation = z.infer<typeof dataModelRelationSchema>;
export type DataModelBlock = z.infer<typeof dataModelSchema>;
