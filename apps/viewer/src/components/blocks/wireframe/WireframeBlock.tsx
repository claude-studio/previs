import { useEffect, useMemo, useRef, type MouseEvent } from 'react';

import type { WireframeBlock as WireframeBlockData } from '@previs/schema';

import { mountRoughOverlay } from './rough-overlay';
import { sanitizeWireframeHtml } from './sanitize';
import './wireframe.css';

const surfaceLabels: Record<WireframeBlockData['surface'], string> = {
  browser: '브라우저',
  desktop: '데스크톱',
  mobile: '모바일',
  popover: '팝오버',
  panel: '패널',
};

function SurfaceChrome({ surface, title }: Pick<WireframeBlockData, 'surface' | 'title'>) {
  const label = title ?? surfaceLabels[surface];

  if (surface === 'browser') {
    return (
      <div className="wf-chrome wf-chrome--browser" aria-hidden="true">
        <div className="wf-chrome__controls">
          <span />
          <span />
          <span />
        </div>
        <div className="wf-chrome__address">previs.local / {label}</div>
        {title ? <span className="wf-chrome__title">{title}</span> : null}
      </div>
    );
  }

  return (
    <div className={`wf-chrome wf-chrome--${surface}`} aria-hidden="true">
      {surface === 'desktop' ? (
        <div className="wf-chrome__controls">
          <span />
          <span />
          <span />
        </div>
      ) : null}
      <span className="wf-chrome__title">{label}</span>
    </div>
  );
}

function blockAnchorNavigation(event: MouseEvent<HTMLDivElement>) {
  if (event.target instanceof Element && event.target.closest('a')) {
    event.preventDefault();
  }
}

export default function WireframeBlock({ block }: { block: WireframeBlockData }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sanitizedHtml = useMemo(() => sanitizeWireframeHtml(block.html), [block.html]);

  useEffect(() => {
    const frame = frameRef.current;
    const root = rootRef.current;

    if (!frame || !root) {
      return undefined;
    }

    return mountRoughOverlay({
      blockId: block.id,
      container: frame,
      root,
    });
  }, [block.id, block.html, block.surface, block.title, sanitizedHtml]);

  return (
    <article
      className={`wf-block wf-surface wf-surface-${block.surface}`}
      data-wf-surface={block.surface}
    >
      <div className="wf-frame" ref={frameRef}>
        <SurfaceChrome surface={block.surface} title={block.title} />
        {sanitizedHtml ? (
          <div
            className="wf-body wf-root"
            ref={rootRef}
            onClick={blockAnchorNavigation}
            onSubmit={(event) => event.preventDefault()}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        ) : (
          <div
            className="wf-body wf-root"
            ref={rootRef}
            onClick={blockAnchorNavigation}
            onSubmit={(event) => event.preventDefault()}
          >
            <p className="wf-empty">표시할 수 없는 와이어프레임입니다.</p>
          </div>
        )}
      </div>
    </article>
  );
}
