import type { Block } from '@previs/schema';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BlockRenderer } from './BlockRenderer';

vi.mock('shiki', () => ({
  createHighlighter: async () => ({
    codeToHtml: (code: string) => `<pre class="shiki"><code>${code}</code></pre>`,
    loadLanguage: async () => undefined,
  }),
}));

vi.mock('mermaid', () => ({
  default: {
    initialize: () => undefined,
    render: async () => ({ svg: '<svg><text>목-다이어그램</text></svg>' }),
  },
}));

describe('BlockRenderer', () => {
  it('renders a prose block as markdown', () => {
    const block: Block = { id: 'p1', type: 'prose', markdown: '# 제목\n\n본문 문단' };
    render(<BlockRenderer block={block} />);
    expect(screen.getByRole('heading', { name: '제목' })).toBeInTheDocument();
    expect(screen.getByText('본문 문단')).toBeInTheDocument();
  });

  it('renders a callout with variant title and body', () => {
    const block: Block = {
      id: 'c1',
      type: 'callout',
      variant: 'warning',
      title: '주의',
      markdown: '스키마는 additive만 허용',
    };
    render(<BlockRenderer block={block} />);
    expect(screen.getByText('주의')).toBeInTheDocument();
    expect(screen.getByText('스키마는 additive만 허용')).toBeInTheDocument();
  });

  it('renders a file tree with status and inferred badges', () => {
    const block: Block = {
      id: 'ft1',
      type: 'file-tree',
      entries: [
        { path: 'src/app.ts', status: 'modified' },
        { path: 'src/new.ts', status: 'added', inferred: true },
      ],
    };
    render(<BlockRenderer block={block} />);
    expect(screen.getByText('app.ts')).toBeInTheDocument();
    expect(screen.getByText('수정')).toBeInTheDocument();
    expect(screen.getByText('inferred')).toBeInTheDocument();
  });

  it('renders tabs and shows the first tab content', () => {
    const block: Block = {
      id: 't1',
      type: 'tabs',
      items: [
        { label: '첫 탭', blocks: [{ id: 'p1', type: 'prose', markdown: '첫 내용' }] },
        { label: '둘째 탭', blocks: [{ id: 'p2', type: 'prose', markdown: '둘째 내용' }] },
      ],
    };
    render(<BlockRenderer block={block} />);
    expect(screen.getByRole('tab', { name: '첫 탭' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '둘째 탭' })).toBeInTheDocument();
    expect(screen.getByText('첫 내용')).toBeInTheDocument();
  });

  it('renders columns with nested blocks', () => {
    const block: Block = {
      id: 'col1',
      type: 'columns',
      items: [
        { blocks: [{ id: 'p1', type: 'prose', markdown: '왼쪽 열' }] },
        { blocks: [{ id: 'p2', type: 'prose', markdown: '오른쪽 열' }] },
      ],
    };
    render(<BlockRenderer block={block} />);
    expect(screen.getByText('왼쪽 열')).toBeInTheDocument();
    expect(screen.getByText('오른쪽 열')).toBeInTheDocument();
  });

  it('renders a diff header immediately and highlighted body after shiki loads', async () => {
    const block: Block = {
      id: 'd1',
      type: 'diff',
      title: '스키마 변경',
      file: 'src/document.ts',
      diff: '+added line',
    };
    const { container } = render(<BlockRenderer block={block} />);
    expect(screen.getByText('스키마 변경')).toBeInTheDocument();
    expect(screen.getByText('src/document.ts')).toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector('.shiki-wrapper .shiki')).toBeInTheDocument();
    });
  });

  it('renders a wireframe block after lazy loading', async () => {
    const block: Block = {
      id: 'wf1',
      type: 'wireframe',
      surface: 'browser',
      title: '문서 목록',
      html: '<main><h1>목록</h1></main>',
    };
    render(<BlockRenderer block={block} />);
    expect(await screen.findByRole('heading', { name: '목록' })).toBeInTheDocument();
  });

  it('renders a diagram block after lazy loading with its caption', async () => {
    const block: Block = {
      id: 'dg1',
      type: 'diagram',
      engine: 'mermaid',
      code: 'flowchart LR\n  A --> B',
      caption: '발행 흐름',
    };
    const { container } = render(<BlockRenderer block={block} />);
    expect(await screen.findByText('발행 흐름')).toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector('.wf-diagram__svg svg')).toBeInTheDocument();
    });
  });

  it('renders an annotated-code block with file header and margin annotations', async () => {
    const block: Block = {
      id: 'ac1',
      type: 'annotated-code',
      file: 'src/index.ts',
      lang: 'typescript',
      code: 'const a = 1;\nconst b = 2;',
      annotations: [{ line: 2, markdown: '두 번째 줄 주석' }],
    };
    const { container } = render(<BlockRenderer block={block} />);
    expect(screen.getByText('src/index.ts')).toBeInTheDocument();
    expect(screen.getByText('두 번째 줄 주석')).toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector('.shiki-wrapper .shiki')).toBeInTheDocument();
    });
  });

  it('renders a data-model block with entities and relations', () => {
    const block: Block = {
      id: 'dm1',
      type: 'data-model',
      entities: [
        { name: 'Document', fields: [{ name: 'id', type: 'string', inferred: true }] },
      ],
      relations: [{ from: 'Document', to: 'Block', kind: '1-n', label: 'contains' }],
    };
    render(<BlockRenderer block={block} />);
    expect(screen.getByRole('heading', { name: 'Document' })).toBeInTheDocument();
    expect(screen.getByText('추론됨')).toBeInTheDocument();
    expect(screen.getByText('1-n')).toBeInTheDocument();
  });

  it('renders an api-endpoint block with method badge and path', () => {
    const block: Block = {
      id: 'api1',
      type: 'api-endpoint',
      method: 'POST',
      path: '/documents',
      responses: [{ status: 201 }],
    };
    render(<BlockRenderer block={block} />);
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('/documents')).toBeInTheDocument();
    expect(screen.getByText('201')).toBeInTheDocument();
  });

  it('renders a question-form block as a read-only list', () => {
    const block: Block = {
      id: 'q1',
      type: 'question-form',
      questions: [
        {
          id: 'q-1',
          prompt: '계획을 승인할까요?',
          options: [{ label: '승인' }],
          allowFreeText: true,
        },
      ],
    };
    render(<BlockRenderer block={block} />);
    expect(screen.getByText('계획을 승인할까요?')).toBeInTheDocument();
    expect(screen.getByText('자유 입력 허용')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
