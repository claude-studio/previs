import { z } from 'zod';

export const apiFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().optional(),
  note: z.string().min(1).optional(),
  inferred: z.boolean().optional(),
});

const apiFieldsSchema = z.array(apiFieldSchema);

const requestSchema = z.object({
  params: apiFieldsSchema.optional(),
  query: apiFieldsSchema.optional(),
  body: apiFieldsSchema.optional(),
});

const responseSchema = z.object({
  status: z.number().int().min(100).max(599),
  note: z.string().min(1).optional(),
  body: apiFieldsSchema.optional(),
});

export const apiEndpointSchema = z.object({
  id: z.string().min(1),
  type: z.literal('api-endpoint'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string().min(1),
  summary: z.string().min(1).optional(),
  request: requestSchema.optional(),
  responses: z.array(responseSchema).min(1),
  inferred: z.boolean().optional(),
});

export type ApiField = z.infer<typeof apiFieldSchema>;
export type ApiEndpointRequest = z.infer<typeof requestSchema>;
export type ApiEndpointResponse = z.infer<typeof responseSchema>;
export type ApiEndpointBlock = z.infer<typeof apiEndpointSchema>;
