import { z } from 'zod';

import { annotatedCodeSchema, type AnnotatedCodeBlock } from './blocks/annotated-code.js';
import { apiEndpointSchema, type ApiEndpointBlock } from './blocks/api-endpoint.js';
import { calloutSchema, type CalloutBlock } from './blocks/callout.js';
import { columnsSchema, type ColumnsBlock } from './blocks/columns.js';
import { dataModelSchema, type DataModelBlock } from './blocks/data-model.js';
import { diagramSchema, type DiagramBlock } from './blocks/diagram.js';
import { diffSchema, type DiffBlock } from './blocks/diff.js';
import { fileTreeSchema, type FileTreeBlock } from './blocks/file-tree.js';
import { proseSchema, type ProseBlock } from './blocks/prose.js';
import { questionFormSchema, type QuestionFormBlock } from './blocks/question-form.js';
import { tabsSchema, type TabsBlock } from './blocks/tabs.js';
import { wireframeSchema, type WireframeBlock } from './blocks/wireframe.js';

export const blockBaseSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
});

export type BlockBase = z.infer<typeof blockBaseSchema>;

export type Block =
  | ProseBlock
  | CalloutBlock
  | FileTreeBlock
  | TabsBlock
  | ColumnsBlock
  | DiffBlock
  | AnnotatedCodeBlock
  | DataModelBlock
  | ApiEndpointBlock
  | WireframeBlock
  | DiagramBlock
  | QuestionFormBlock;

export const blockSchema: z.ZodType<Block> = z.lazy(() =>
  z.discriminatedUnion('type', [
    proseSchema,
    calloutSchema,
    fileTreeSchema,
    tabsSchema,
    columnsSchema,
    diffSchema,
    annotatedCodeSchema,
    dataModelSchema,
    apiEndpointSchema,
    wireframeSchema,
    diagramSchema,
    questionFormSchema,
  ]),
);
