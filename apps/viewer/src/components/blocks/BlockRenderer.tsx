import type { Block } from '@previs/schema';
import { Component, lazy, Suspense, type ReactNode } from 'react';

import { Button } from '../ui/button';
import { CalloutBlock } from './CalloutBlock';
import { ColumnsBlock } from './ColumnsBlock';
import { DiffBlock } from './DiffBlock';
import { FallbackBlock } from './FallbackBlock';
import { FileTreeBlock } from './FileTreeBlock';
import { ProseBlock } from './ProseBlock';
import { TabsBlock } from './TabsBlock';

const LazyWireframeBlock = lazy(() => import('./wireframe/WireframeBlock'));

function WireframeLoadingFallback() {
  return (
    <section
      className="min-h-48 animate-pulse rounded-xl border border-dashed border-hairline bg-surface-soft p-5"
      aria-label="와이어프레임을 불러오는 중"
    >
      <div className="h-3 w-28 rounded-full bg-hairline" />
      <div className="mt-5 h-24 rounded-lg border border-hairline bg-canvas" />
    </section>
  );
}

// 모듈 로드 실패는 브라우저 모듈 맵에 캐시되어 동일 specifier 재-import로는
// 복구할 수 없다 (Vite troubleshooting) — 복구 수단은 새로고침뿐이다.
class WireframeErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="rounded-xl border border-dashed border-hairline bg-surface-soft p-5">
          <p className="text-sm text-steel">
            와이어프레임 렌더러를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.
          </p>
          <Button
            className="mt-3"
            onClick={() => window.location.reload()}
            size="sm"
            variant="secondary"
          >
            새로고침
          </Button>
        </section>
      );
    }

    return this.props.children;
  }
}

function WireframeRenderer({ block }: { block: Extract<Block, { type: 'wireframe' }> }) {
  return (
    <WireframeErrorBoundary>
      <Suspense fallback={<WireframeLoadingFallback />}>
        <LazyWireframeBlock block={block} />
      </Suspense>
    </WireframeErrorBoundary>
  );
}

const renderers: Record<string, (block: Block) => ReactNode> = {
  prose: (block) => <ProseBlock block={block as Extract<Block, { type: 'prose' }>} />,
  callout: (block) => <CalloutBlock block={block as Extract<Block, { type: 'callout' }>} />,
  'file-tree': (block) => <FileTreeBlock block={block as Extract<Block, { type: 'file-tree' }>} />,
  tabs: (block) => <TabsBlock block={block as Extract<Block, { type: 'tabs' }>} />,
  columns: (block) => <ColumnsBlock block={block as Extract<Block, { type: 'columns' }>} />,
  diff: (block) => <DiffBlock block={block as Extract<Block, { type: 'diff' }>} />,
  wireframe: (block) => (
    <WireframeRenderer block={block as Extract<Block, { type: 'wireframe' }>} />
  ),
};

export function BlockRenderer({ block }: { block: Block }) {
  const render = renderers[block.type];

  return (
    <div className="block-renderer" data-block-id={block.id}>
      {render ? render(block) : <FallbackBlock type={block.type} />}
    </div>
  );
}
