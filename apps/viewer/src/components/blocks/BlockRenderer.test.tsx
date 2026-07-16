import type { Block } from '@previs/schema';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BlockRenderer } from './BlockRenderer';

vi.mock('shiki', () => ({
  createHighlighter: async () => ({
    codeToHtml: (code: string) => `<pre class="shiki"><code>${code}</code></pre>`,
  }),
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

  it('renders remaining M3 blocks with the fallback placeholder', () => {
    const block: Block = {
      id: 'dg1',
      type: 'diagram',
      engine: 'mermaid',
      code: 'flowchart LR\n  A --> B',
    };
    render(<BlockRenderer block={block} />);
    expect(screen.getByText('다이어그램')).toBeInTheDocument();
    expect(screen.getByText('이 블록은 M3에서 지원됩니다.')).toBeInTheDocument();
  });
});
