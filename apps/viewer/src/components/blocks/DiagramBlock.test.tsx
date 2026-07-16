import type { DiagramBlock as DiagramBlockData } from '@previs/schema';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DiagramBlock from './DiagramBlock';

const mermaidSpies = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(async () => ({ svg: '<svg><text>목-도표</text></svg>' })),
}));

vi.mock('mermaid', () => ({
  default: { initialize: mermaidSpies.initialize, render: mermaidSpies.render },
}));

function diagramBlock(overrides: Partial<DiagramBlockData> = {}): DiagramBlockData {
  return {
    id: 'dg-test',
    type: 'diagram',
    engine: 'mermaid',
    code: 'flowchart LR\n  A --> B',
    ...overrides,
  };
}

describe('DiagramBlock', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
    mermaidSpies.render.mockClear();
  });

  it('renders the sanitized svg with a figcaption', async () => {
    const { container } = render(<DiagramBlock block={diagramBlock({ caption: '발행 흐름' })} />);

    await waitFor(() => {
      expect(container.querySelector('.wf-diagram__svg svg')).toBeInTheDocument();
    });
    expect(screen.getByText('발행 흐름')).toBeInTheDocument();
  });

  it('shows an inline notice with the source when mermaid fails', async () => {
    mermaidSpies.render.mockRejectedValueOnce(new Error('parse error'));

    render(<DiagramBlock block={diagramBlock({ code: 'flowchart LR\n  broken' })} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '다이어그램을 렌더링하지 못했습니다.',
    );
    expect(screen.getByText(/broken/)).toBeInTheDocument();
  });

  it('refuses external-resource diagrams without rendering', async () => {
    render(
      <DiagramBlock block={diagramBlock({ code: 'flowchart LR\n  A[https://example.com]' })} />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '외부 리소스를 참조하는 다이어그램은 지원되지 않습니다.',
    );
    expect(mermaidSpies.render).not.toHaveBeenCalled();
  });

  it('re-renders when the document theme class changes', async () => {
    const { container } = render(<DiagramBlock block={diagramBlock()} />);

    await waitFor(() => {
      expect(container.querySelector('.wf-diagram__svg svg')).toBeInTheDocument();
    });
    expect(mermaidSpies.render).toHaveBeenCalledTimes(1);

    document.documentElement.classList.add('dark');

    await waitFor(() => {
      expect(mermaidSpies.render).toHaveBeenCalledTimes(2);
    });
  });
});
