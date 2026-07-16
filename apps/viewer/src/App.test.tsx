import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

vi.mock('shiki', () => ({
  createHighlighter: async () => ({
    codeToHtml: (code: string) => `<pre class="shiki"><code>${code}</code></pre>`,
  }),
}));

const openedDocument = (title: string) => ({
  schemaVersion: 1,
  id: 'opened-doc',
  kind: 'plan',
  title,
  createdAt: '2026-07-16T10:00:00Z',
  blocks: [{ id: 'p1', type: 'prose', markdown: '열린 문서 본문' }],
});

function openFile(container: HTMLElement, contents: string) {
  const input = container.querySelector('input[type="file"]');
  if (!input) {
    throw new Error('file input not found');
  }
  const file = new File([contents], 'doc.json', { type: 'application/json' });
  fireEvent.change(input, { target: { files: [file] } });
}

describe('App', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('lists the builtin fixtures as document cards', () => {
    render(<App />);
    expect(screen.getByText('문서 목록')).toBeInTheDocument();
    expect(screen.getByText('블록 스키마 모노레포 구현 계획')).toBeInTheDocument();
    expect(screen.getByText('블록 스키마 모노레포 구현 회고')).toBeInTheDocument();
    expect(screen.getByText('전체 블록 스키마 픽스처')).toBeInTheDocument();
  });

  it('navigates to a fixture and renders its blocks', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('블록 스키마 모노레포 구현 회고'));
    await waitFor(() => {
      expect(screen.getByText('RECAP')).toBeInTheDocument();
    });
    expect(screen.getByText('내장 픽스처')).toBeInTheDocument();
    expect(
      screen.getByText('공유 JSON 블록 계약과 TypeScript 모노레포 기반을 추가했습니다.'),
    ).toBeInTheDocument();
  });

  it('opens a valid JSON file and navigates to the document view', async () => {
    const { container } = render(<App />);
    openFile(container, JSON.stringify(openedDocument('열린 계획 문서')));
    await waitFor(() => {
      expect(screen.getByText('열린 계획 문서')).toBeInTheDocument();
    });
    expect(screen.getByText('열린 파일')).toBeInTheDocument();
    expect(screen.getByText('열린 문서 본문')).toBeInTheDocument();
  });

  it('shows an inline error when the opened file fails validation', async () => {
    const { container } = render(<App />);
    openFile(container, JSON.stringify({ kind: 'plan' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText('문서를 열지 못했습니다.')).toBeInTheDocument();
  });

  it('routes documents whose id contains a percent sign', async () => {
    const { container } = render(<App />);
    openFile(
      container,
      JSON.stringify({ ...openedDocument('백분율 문서'), id: 'release-100%' }),
    );
    await waitFor(() => {
      expect(screen.getByText('백분율 문서')).toBeInTheDocument();
    });
    expect(screen.getByText('열린 문서 본문')).toBeInTheDocument();
  });

  it('routes documents whose id contains an encoded-slash literal', async () => {
    const { container } = render(<App />);
    openFile(
      container,
      JSON.stringify({ ...openedDocument('인코딩 문서'), id: 'feature%2Fviewer' }),
    );
    await waitFor(() => {
      expect(screen.getByText('인코딩 문서')).toBeInTheDocument();
    });
    expect(screen.getByText('열린 문서 본문')).toBeInTheDocument();
  });

  it('routes documents whose id contains a real slash', async () => {
    const { container } = render(<App />);
    openFile(
      container,
      JSON.stringify({ ...openedDocument('슬래시 문서'), id: 'docs/plan-1' }),
    );
    await waitFor(() => {
      expect(screen.getByText('슬래시 문서')).toBeInTheDocument();
    });
    expect(screen.getByText('열린 문서 본문')).toBeInTheDocument();
  });

  it('replaces the stored document when the same id is opened again', async () => {
    const { container } = render(<App />);
    openFile(container, JSON.stringify(openedDocument('첫 번째 버전')));
    await waitFor(() => {
      expect(screen.getByText('첫 번째 버전')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('문서 목록'));
    openFile(container, JSON.stringify(openedDocument('두 번째 버전')));
    await waitFor(() => {
      expect(screen.getByText('두 번째 버전')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('문서 목록'));
    await waitFor(() => {
      expect(screen.getAllByRole('link')).toHaveLength(4);
    });
    expect(screen.queryByText('첫 번째 버전')).not.toBeInTheDocument();
  });
});
