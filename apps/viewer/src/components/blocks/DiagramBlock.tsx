import { useEffect, useState } from 'react';

import type { DiagramBlock as DiagramBlockData } from '@previs/schema';

import {
  EXTERNAL_RESOURCE_MESSAGE,
  readWireframeTokens,
  renderDiagram,
  type DiagramRenderResult,
} from './diagram-mermaid';
import './wireframe/tokens.css';
import './wireframe/wireframe.css';

const genericDiagramError = '다이어그램을 렌더링하지 못했습니다.';

function captionId(blockId: string): string {
  return `diagram-caption-${blockId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function resultError(result: DiagramRenderResult): string | null {
  return result.status === 'external-resource' ? EXTERNAL_RESOURCE_MESSAGE : null;
}

export default function DiagramBlock({ block }: { block: DiagramBlockData }) {
  const [themeGeneration, setThemeGeneration] = useState(0);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const labelledBy = block.caption ? captionId(block.id) : undefined;

  useEffect(() => {
    const root = document.documentElement;

    if (typeof MutationObserver === 'undefined') {
      return undefined;
    }

    const observer = new MutationObserver(() => {
      setThemeGeneration((current) => current + 1);
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const generation = themeGeneration;

    setSvg(null);
    setError(null);

    void (async () => {
      try {
        const result = await renderDiagram({
          blockId: block.id,
          code: block.code,
          generation,
          isGenerationCurrent: (candidate) => !cancelled && candidate === generation,
          tokens: readWireframeTokens(),
        });

        if (cancelled || result.status === 'stale') {
          return;
        }

        const resultMessage = resultError(result);
        if (resultMessage) {
          setError(resultMessage);
          return;
        }

        if (result.status === 'success') {
          setSvg(result.svg);
        }
      } catch {
        if (!cancelled) {
          setError(genericDiagramError);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [block.code, block.id, themeGeneration]);

  return (
    <figure
      aria-label={block.caption ? undefined : '다이어그램'}
      aria-labelledby={labelledBy}
      className="wf-block wf-diagram"
    >
      <div className="wf-diagram__viewport" role="img">
        {svg ? (
          <div className="wf-diagram__svg" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : error ? (
          <div className="wf-diagram__error" role="alert">
            <p className="wf-diagram__error-message">{error}</p>
            <pre className="wf-diagram__source">
              <code>{block.code}</code>
            </pre>
          </div>
        ) : (
          <p className="wf-empty" aria-busy="true">
            다이어그램을 렌더링하는 중입니다.
          </p>
        )}
      </div>
      {block.caption ? (
        <figcaption className="wf-diagram__caption" id={labelledBy}>
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
