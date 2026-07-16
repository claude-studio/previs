import type { Block } from '@previs/schema';
import { Component, lazy, Suspense, type ReactNode } from 'react';

import { Button } from '../ui/button';
import { ApiEndpointBlock } from './ApiEndpointBlock';
import { AnnotatedCodeBlock } from './AnnotatedCodeBlock';
import { CalloutBlock } from './CalloutBlock';
import { ColumnsBlock } from './ColumnsBlock';
import { DataModelBlock } from './DataModelBlock';
import { DiffBlock } from './DiffBlock';
import { FallbackBlock } from './FallbackBlock';
import { FileTreeBlock } from './FileTreeBlock';
import { ProseBlock } from './ProseBlock';
import { QuestionFormBlock } from './QuestionFormBlock';
import { TabsBlock } from './TabsBlock';

const LazyWireframeBlock = lazy(() => import('./wireframe/WireframeBlock'));
const LazyDiagramBlock = lazy(() => import('./DiagramBlock'));

function LazyBlockLoadingFallback({ label }: { label: string }) {
  return (
    <section
      className="min-h-48 animate-pulse rounded-xl border border-dashed border-hairline bg-surface-soft p-5"
      aria-label={`${label}을 불러오는 중`}
    >
      <div className="h-3 w-28 rounded-full bg-hairline" />
      <div className="mt-5 h-24 rounded-lg border border-hairline bg-canvas" />
    </section>
  );
}

// 모듈 로드 실패는 브라우저 모듈 맵에 캐시되어 동일 specifier 재-import로는
// 복구할 수 없다 (Vite troubleshooting) — 복구 수단은 새로고침뿐이다.
class LazyBlockErrorBoundary extends Component<
  { children: ReactNode; label: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="rounded-xl border border-dashed border-hairline bg-surface-soft p-5">
          <p className="text-sm text-steel">
            {this.props.label} 렌더러를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.
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

function LazyBlockRenderer({ label, children }: { label: string; children: ReactNode }) {
  return (
    <LazyBlockErrorBoundary label={label}>
      <Suspense fallback={<LazyBlockLoadingFallback label={label} />}>{children}</Suspense>
    </LazyBlockErrorBoundary>
  );
}

function WireframeRenderer({ block }: { block: Extract<Block, { type: 'wireframe' }> }) {
  return (
    <LazyBlockRenderer label="와이어프레임">
      <LazyWireframeBlock block={block} />
    </LazyBlockRenderer>
  );
}

function DiagramRenderer({ block }: { block: Extract<Block, { type: 'diagram' }> }) {
  return (
    <LazyBlockRenderer label="다이어그램">
      <LazyDiagramBlock block={block} />
    </LazyBlockRenderer>
  );
}

const renderers: Record<string, (block: Block) => ReactNode> = {
  prose: (block) => <ProseBlock block={block as Extract<Block, { type: 'prose' }>} />,
  callout: (block) => <CalloutBlock block={block as Extract<Block, { type: 'callout' }>} />,
  'file-tree': (block) => <FileTreeBlock block={block as Extract<Block, { type: 'file-tree' }>} />,
  tabs: (block) => <TabsBlock block={block as Extract<Block, { type: 'tabs' }>} />,
  columns: (block) => <ColumnsBlock block={block as Extract<Block, { type: 'columns' }>} />,
  diff: (block) => <DiffBlock block={block as Extract<Block, { type: 'diff' }>} />,
  'annotated-code': (block) => (
    <AnnotatedCodeBlock block={block as Extract<Block, { type: 'annotated-code' }>} />
  ),
  'data-model': (block) => (
    <DataModelBlock block={block as Extract<Block, { type: 'data-model' }>} />
  ),
  'api-endpoint': (block) => (
    <ApiEndpointBlock block={block as Extract<Block, { type: 'api-endpoint' }>} />
  ),
  'question-form': (block) => (
    <QuestionFormBlock block={block as Extract<Block, { type: 'question-form' }>} />
  ),
  diagram: (block) => <DiagramRenderer block={block as Extract<Block, { type: 'diagram' }>} />,
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
