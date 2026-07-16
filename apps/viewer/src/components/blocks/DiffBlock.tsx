import { useEffect, useState } from 'react';

import type { DiffBlock as DiffBlockData } from '@previs/schema';

type ShikiHighlighter = import('shiki').Highlighter;
type ShikiTransformer = import('shiki').ShikiTransformer;

let highlighterPromise: Promise<ShikiHighlighter> | undefined;

// @@ 헌크가 있으면 헌크 내부만 분류(+++/--- 파일 헤더는 헌크 밖에만 온다),
// 없으면 발췌(excerpt)로 보고 모든 +/− 행을 분류한다.
export function classifyDiffLines(diff: string): ('add' | 'remove' | undefined)[] {
  const lines = diff.split('\n');
  const hasHunks = lines.some((line) => line.startsWith('@@'));
  let inHunk = !hasHunks;

  return lines.map((line) => {
    if (hasHunks && line.startsWith('@@')) {
      inHunk = true;
      return undefined;
    }

    if (!inHunk) {
      return undefined;
    }

    if (line.startsWith('+')) {
      return 'add';
    }

    if (line.startsWith('-')) {
      return 'remove';
    }

    return undefined;
  });
}

function diffLineClasses(diff: string): ShikiTransformer {
  const classes = classifyDiffLines(diff);

  return {
    line(node, line) {
      const kind = classes[line - 1];

      if (kind) {
        this.addClassToHast(node, `line-${kind}`);
      }
    },
  };
}

function getHighlighter() {
  highlighterPromise ??= import('shiki').then(({ createHighlighter }) =>
    createHighlighter({
      langs: ['diff'],
      themes: ['github-light', 'github-dark'],
    }),
  );

  return highlighterPromise;
}

async function highlightDiff(diff: string): Promise<string> {
  const highlighter = await getHighlighter();

  return highlighter.codeToHtml(diff, {
    lang: 'diff',
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    transformers: [diffLineClasses(diff)],
  });
}

export function DiffBlock({ block }: { block: DiffBlockData }) {
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHighlighted(null);

    highlightDiff(block.diff).then((html) => {
      if (!cancelled) {
        setHighlighted(html);
      }
    }).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [block.diff]);

  return (
    <section className="overflow-hidden rounded-xl border border-hairline bg-canvas">
      <header className="border-b border-hairline-soft bg-surface px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-sm font-semibold text-ink">{block.title}</h3>
          <code className="font-mono text-xs text-steel">{block.file}</code>
        </div>
        {block.note ? <p className="mt-1 text-xs text-muted">{block.note}</p> : null}
      </header>
      <div className="diff-surface overflow-x-auto bg-surface-soft p-4">
        {highlighted ? (
          <div
            className="shiki-wrapper text-xs leading-6"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : (
          <pre className="font-mono text-xs leading-6 text-charcoal">
            <code>{block.diff}</code>
          </pre>
        )}
      </div>
    </section>
  );
}
