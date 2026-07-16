import { z } from 'zod';

import { blockSchema, type Block } from '../block.js';

const nestedBlockSchema: z.ZodType<Block> = z.lazy(() => blockSchema);

const tabsItemSchema = z.object({
  label: z.string().min(1),
  blocks: z.array(nestedBlockSchema).min(1),
});

export const tabsSchema = z.object({
  id: z.string().min(1),
  type: z.literal('tabs'),
  items: z.array(tabsItemSchema).min(1),
});

export interface TabsItem {
  label: string;
  blocks: Block[];
}

export interface TabsBlock {
  id: string;
  type: 'tabs';
  items: TabsItem[];
}
