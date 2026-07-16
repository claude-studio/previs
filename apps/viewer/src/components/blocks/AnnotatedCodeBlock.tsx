import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import type {
  AnnotatedCodeAnnotation,
  AnnotatedCodeBlock as AnnotatedCodeBlockData,
} from '@previs/schema';

import { highlightCode, type CodeHighlightTransformer } from '../../lib/highlighter';

export function getDisplayedLineNumber(codeLine: number, startLine = 1): number {
  return startLine + codeLine - 1;
}

export function groupAnnotationsByLine(
  annotations: readonly AnnotatedCodeAnnotation[],
): Map<number, AnnotatedCodeAnnotation[]> {
  const grouped = new Map<number, AnnotatedCodeAnnotation[]>();

  for (const annotation of annotations) {
    const lineAnnotations = grouped.get(annotation.line) ?? [];
    grouped.set(annotation.line, [...lineAnnotations, annotation]);
  }

  return grouped;
}

function lineAnchorId(blockId: string, codeLine: number): string {
  const safeBlockId = blockId.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `${safeBlockId}-line-${codeLine}`;
}

function annotationLineClasses(
  annotations: readonly AnnotatedCodeAnnotation[],
  blockId: string,
  startLine: number,
): CodeHighlightTransformer {
  const annotationsByLine = groupAnnotationsByLine(annotations);

  return {
    line(node, codeLine) {
      const lineAnnotations = annotationsByLine.get(codeLine);

      node.properties.id = lineAnchorId(blockId, codeLine);
      node.properties['data-line-number'] = String(getDisplayedLineNumber(codeLine, startLine));

      const lineNumber = {
        type: 'element' as const,
        tagName: 'span',
        properties: {
          ariaHidden: 'true',
          className: ['line-number'],
        },
        children: [
          {
            type: 'text' as const,
            value: String(getDisplayedLineNumber(codeLine, startLine)),
          },
        ],
      };
      node.children.unshift(lineNumber);

      if (lineAnnotations?.length) {
        this.addClassToHast(node, 'line-annotated');
        node.properties['data-annotation-line'] = String(codeLine);
      }
    },
  };
}

function AnnotationMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="document-markdown text-sm leading-6 text-charcoal">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}

export function AnnotatedCodeBlock({ block }: { block: AnnotatedCodeBlockData }) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const startLine = block.startLine ?? 1;
  const annotations = useMemo(
    () => [...block.annotations].sort((left, right) => left.line - right.line),
    [block.annotations],
  );

  useEffect(() => {
    let cancelled = false;
    setHighlighted(null);

    highlightCode(block.code, {
      lang: block.lang,
      transformers: [annotationLineClasses(block.annotations, block.id, startLine)],
    })
      .then((html) => {
        if (!cancelled) {
          setHighlighted(html);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [block.code, block.id, block.lang, block.annotations, startLine]);

  return (
    <section
      aria-label={block.file ? `주석 코드 ${block.file}` : '주석 코드'}
      className="overflow-hidden rounded-xl border border-hairline bg-canvas"
    >
      {block.file ? (
        <header className="border-b border-hairline-soft bg-surface px-4 py-3">
          <code className="font-mono text-xs text-steel">{block.file}</code>
        </header>
      ) : null}

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div className="annotated-code-wrapper min-w-0 overflow-x-auto rounded-lg bg-surface-soft p-4">
          {highlighted ? (
            <div
              className="shiki-wrapper text-xs leading-6"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          ) : (
            <pre className="font-mono text-xs leading-6 text-charcoal">
              <code>{block.code}</code>
            </pre>
          )}
        </div>

        {annotations.length ? (
          <aside aria-label="코드 주석" className="min-w-0">
            <ol className="space-y-3">
              {annotations.map((annotation) => (
                <li key={`${annotation.line}-${annotation.markdown}`}>
                  <a
                    className="block rounded-lg border border-hairline-soft bg-surface p-3 transition-colors hover:border-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    href={`#${lineAnchorId(block.id, annotation.line)}`}
                  >
                    <span className="mb-2 inline-flex rounded-full bg-info-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-info">
                      {getDisplayedLineNumber(annotation.line, startLine)}
                    </span>
                    <AnnotationMarkdown markdown={annotation.markdown} />
                  </a>
                </li>
              ))}
            </ol>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
