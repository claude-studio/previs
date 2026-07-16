import { z } from 'zod';

import { blockSchema, type Block } from '../block.js';

const nestedBlockSchema: z.ZodType<Block> = z.lazy(() => blockSchema);

const columnsItemSchema = z.object({
  blocks: z.array(nestedBlockSchema).min(1),
});

export const columnsSchema = z.object({
  id: z.string().min(1),
  type: z.literal('columns'),
  items: z.array(columnsItemSchema).min(2).max(4),
});

export interface ColumnsItem {
  blocks: Block[];
}

export interface ColumnsBlock {
  id: string;
  type: 'columns';
  items: ColumnsItem[];
}
