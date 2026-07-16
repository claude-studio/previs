import type { Block } from '@previs/schema';
import type { ReactNode } from 'react';

import { CalloutBlock } from './CalloutBlock';
import { ColumnsBlock } from './ColumnsBlock';
import { DiffBlock } from './DiffBlock';
import { FallbackBlock } from './FallbackBlock';
import { FileTreeBlock } from './FileTreeBlock';
import { ProseBlock } from './ProseBlock';
import { TabsBlock } from './TabsBlock';

const renderers: Record<string, (block: Block) => ReactNode> = {
  prose: (block) => <ProseBlock block={block as Extract<Block, { type: 'prose' }>} />,
  callout: (block) => (
    <CalloutBlock block={block as Extract<Block, { type: 'callout' }>} />
  ),
  'file-tree': (block) => (
    <FileTreeBlock block={block as Extract<Block, { type: 'file-tree' }>} />
  ),
  tabs: (block) => <TabsBlock block={block as Extract<Block, { type: 'tabs' }>} />,
  columns: (block) => (
    <ColumnsBlock block={block as Extract<Block, { type: 'columns' }>} />
  ),
  diff: (block) => <DiffBlock block={block as Extract<Block, { type: 'diff' }>} />,
};

export function BlockRenderer({ block }: { block: Block }) {
  const render = renderers[block.type];

  return (
    <div className="block-renderer" data-block-id={block.id}>
      {render ? render(block) : <FallbackBlock type={block.type} />}
    </div>
  );
}
