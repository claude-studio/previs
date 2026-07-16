import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AnnotatedCodeBlock as AnnotatedCodeBlockData } from '@previs/schema';

import {
  AnnotatedCodeBlock,
  getDisplayedLineNumber,
  groupAnnotationsByLine,
} from './AnnotatedCodeBlock';

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const hastToHtml = (node: HastNode): string => {
  if (node.type === 'text') {
    return node.value ?? '';
  }

  const properties = node.properties ?? {};
  const attributes = Object.entries(properties)
    .map(([key, value]) =>
      key === 'className'
        ? ` class="${(value as string[]).join(' ')}"`
        : ` ${key.toLowerCase()}="${String(value)}"`,
    )
    .join('');
  const children = (node.children ?? []).map(hastToHtml).join('');

  return `<${node.tagName}${attributes}>${children}</${node.tagName}>`;
};

vi.mock('shiki', () => ({
  createHighlighter: async () => ({
    loadLanguage: async () => undefined,
    codeToHtml: (
      code: string,
      options: {
        transformers?: Array<{
          line?: (this: { addClassToHast: (node: HastNode, cls: string) => void },
            node: HastNode, line: number) => void;
        }>;
      },
    ) => {
      const lines = code.split('\n').map((text, index) => {
        const node: HastNode = {
          type: 'element',
          tagName: 'span',
          properties: {},
          children: [{ type: 'text', value: text }],
        };

        options.transformers?.forEach((transformer) => {
          transformer.line?.call(
            {
              addClassToHast: (target: HastNode, cls: string) => {
                const classes = (target.properties ??= {});
                classes.className = [...((classes.className as string[]) ?? []), cls];
              },
            },
            node,
            index + 1,
          );
        });

        return hastToHtml(node);
      });

      return `<pre class="shiki"><code>${lines.join('\n')}</code></pre>`;
    },
  }),
}));

function annotatedBlock(
  overrides: Partial<AnnotatedCodeBlockData> = {},
): AnnotatedCodeBlockData {
  return {
    id: 'ac-test',
    type: 'annotated-code',
    lang: 'typescript',
    code: 'const a = 1;\nconst b = 2;\nconst c = 3;',
    annotations: [{ line: 2, markdown: '두 번째 줄 설명' }],
    ...overrides,
  };
}

describe('getDisplayedLineNumber', () => {
  it('offsets code-relative lines by startLine', () => {
    expect(getDisplayedLineNumber(1)).toBe(1);
    expect(getDisplayedLineNumber(1, 48)).toBe(48);
    expect(getDisplayedLineNumber(3, 48)).toBe(50);
  });
});

describe('groupAnnotationsByLine', () => {
  it('groups multiple annotations attached to the same line', () => {
    const grouped = groupAnnotationsByLine([
      { line: 2, markdown: '첫 주석' },
      { line: 2, markdown: '둘째 주석' },
      { line: 5, markdown: '다른 줄' },
    ]);

    expect(grouped.get(2)).toHaveLength(2);
    expect(grouped.get(5)).toHaveLength(1);
    expect(grouped.get(1)).toBeUndefined();
  });
});

describe('AnnotatedCodeBlock', () => {
  it('marks annotated lines and shows startLine-based line numbers', async () => {
    const { container } = render(
      <AnnotatedCodeBlock block={annotatedBlock({ startLine: 10 })} />,
    );

    await waitFor(() => {
      expect(container.querySelector('.line-annotated')).toBeInTheDocument();
    });
    const numbers = [...container.querySelectorAll('.line-number')].map(
      (element) => element.textContent,
    );
    expect(numbers).toEqual(['10', '11', '12']);
  });

  it('renders the file header and margin annotations linked to line anchors', async () => {
    const { container } = render(
      <AnnotatedCodeBlock block={annotatedBlock({ file: 'src/index.ts' })} />,
    );

    expect(screen.getByText('src/index.ts')).toBeInTheDocument();
    expect(screen.getByText('두 번째 줄 설명')).toBeInTheDocument();

    const annotationLink = screen.getByRole('link');
    expect(annotationLink).toHaveAttribute('href', '#ac-test-line-2');
    await waitFor(() => {
      expect(container.querySelector('#ac-test-line-2')).toBeInTheDocument();
    });
  });

  it('renders code only when there are no annotations', async () => {
    const { container } = render(<AnnotatedCodeBlock block={annotatedBlock({ annotations: [] })} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector('.shiki')).toBeInTheDocument();
    });
    expect(container.querySelector('.line-annotated')).not.toBeInTheDocument();
  });
});
