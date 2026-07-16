import { z } from 'zod';

import { blockSchema, type Block } from './block.js';
import type { ColumnsBlock } from './blocks/columns.js';
import type { TabsBlock } from './blocks/tabs.js';

const sourceSchema = z.object({
  branch: z.string().min(1).optional(),
  commitRange: z.string().min(1).optional(),
  pr: z.union([z.number().int().positive(), z.string().min(1)]).optional(),
});

const documentSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  kind: z.enum(['plan', 'recap']),
  title: z.string().min(1),
  createdAt: z.iso.datetime({ offset: true }),
  source: sourceSchema.optional(),
  blocks: z.array(blockSchema).min(1),
});

export const MAX_CONTAINER_DEPTH = 4;

function walkBlocks(
  blocks: Block[],
  containerDepth: number,
  ids: Set<string>,
  context: z.RefinementCtx,
  path: (string | number)[],
): void {
  blocks.forEach((block, index) => {
    const blockPath = [...path, index];

    if (ids.has(block.id)) {
      context.addIssue({
        code: 'custom',
        path: [...blockPath, 'id'],
        message: `duplicate block id: ${block.id}`,
      });
    }
    ids.add(block.id);

    if (block.type === 'tabs') {
      walkContainerItems(block, containerDepth, ids, context, [...blockPath, 'items']);
    } else if (block.type === 'columns') {
      walkContainerItems(block, containerDepth, ids, context, [...blockPath, 'items']);
    }
  });
}

function walkContainerItems(
  block: TabsBlock | ColumnsBlock,
  containerDepth: number,
  ids: Set<string>,
  context: z.RefinementCtx,
  path: (string | number)[],
): void {
  const nextDepth = containerDepth + 1;

  if (nextDepth > MAX_CONTAINER_DEPTH) {
    context.addIssue({
      code: 'custom',
      path,
      message: `container nesting depth must not exceed ${MAX_CONTAINER_DEPTH}`,
    });
  }

  block.items.forEach((item, index) => {
    walkBlocks(item.blocks, nextDepth, ids, context, [...path, index, 'blocks']);
  });
}

export const previsDocumentSchema = documentSchema.superRefine((document, context) => {
  walkBlocks(document.blocks, 0, new Set<string>(), context, ['blocks']);
});

export type DocumentSource = z.infer<typeof sourceSchema>;
export type PrevisDocument = z.infer<typeof previsDocumentSchema>;
