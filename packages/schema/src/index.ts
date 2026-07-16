import { previsDocumentSchema, type PrevisDocument } from './document.js';

export { blockBaseSchema, blockSchema } from './block.js';
export type { Block, BlockBase } from './block.js';

export {
  annotatedCodeSchema,
  type AnnotatedCodeAnnotation,
  type AnnotatedCodeBlock,
} from './blocks/annotated-code.js';
export {
  apiEndpointSchema,
  apiFieldSchema,
  type ApiEndpointBlock,
  type ApiEndpointRequest,
  type ApiEndpointResponse,
  type ApiField,
} from './blocks/api-endpoint.js';
export { calloutSchema, type CalloutBlock } from './blocks/callout.js';
export { columnsSchema, type ColumnsBlock, type ColumnsItem } from './blocks/columns.js';
export {
  dataModelSchema,
  type DataModelBlock,
  type DataModelEntity,
  type DataModelField,
  type DataModelRelation,
} from './blocks/data-model.js';
export { diagramSchema, type DiagramBlock } from './blocks/diagram.js';
export { diffSchema, type DiffBlock } from './blocks/diff.js';
export { fileTreeSchema, type FileTreeBlock, type FileTreeEntry } from './blocks/file-tree.js';
export { proseSchema, type ProseBlock } from './blocks/prose.js';
export {
  questionFormSchema,
  type Question,
  type QuestionFormBlock,
  type QuestionOption,
} from './blocks/question-form.js';
export { tabsSchema, type TabsBlock, type TabsItem } from './blocks/tabs.js';
export { wireframeSchema, type WireframeBlock } from './blocks/wireframe.js';

export {
  MAX_CONTAINER_DEPTH,
  previsDocumentSchema,
  type DocumentSource,
  type PrevisDocument,
} from './document.js';

export function parsePrevisDocument(input: unknown): PrevisDocument {
  return previsDocumentSchema.parse(input);
}

export function safeParsePrevisDocument(input: unknown) {
  return previsDocumentSchema.safeParse(input);
}
