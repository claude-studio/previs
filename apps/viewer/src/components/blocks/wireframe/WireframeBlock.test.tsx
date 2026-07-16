import type { WireframeBlock as WireframeBlockData } from '@previs/schema';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import WireframeBlock from './WireframeBlock';

function wireframe(overrides: Partial<WireframeBlockData> = {}): WireframeBlockData {
  return {
    id: 'wf-test',
    type: 'wireframe',
    surface: 'browser',
    html: '<main><h1>화면</h1></main>',
    ...overrides,
  };
}

const surfaces: WireframeBlockData['surface'][] = [
  'browser',
  'desktop',
  'mobile',
  'popover',
  'panel',
];

describe('WireframeBlock', () => {
  it.each(surfaces)('renders %s surface chrome without crashing', (surface) => {
    const { container } = render(<WireframeBlock block={wireframe({ surface })} />);
    expect(container.querySelector(`.wf-surface-${surface}`)).toBeInTheDocument();
    expect(container.querySelector(`.wf-chrome--${surface}`)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '화면' })).toBeInTheDocument();
  });

  it('shows the block title in the chrome', () => {
    const { container } = render(
      <WireframeBlock block={wireframe({ surface: 'desktop', title: '검토 작업공간' })} />,
    );
    expect(container.querySelector('.wf-chrome__title')?.textContent).toBe('검토 작업공간');
  });

  it('shows the browser address strip', () => {
    const { container } = render(<WireframeBlock block={wireframe()} />);
    expect(container.querySelector('.wf-chrome__address')).toBeInTheDocument();
  });

  it('injects sanitized html only', () => {
    const { container } = render(
      <WireframeBlock
        block={wireframe({ html: '<section onclick="alert(1)"><p>내용</p></section>' })}
      />,
    );
    const section = container.querySelector('.wf-root section');
    expect(section).toBeInTheDocument();
    expect(section?.hasAttribute('onclick')).toBe(false);
  });

  it('renders an inline notice when sanitize strips everything', () => {
    render(<WireframeBlock block={wireframe({ html: '<script>alert(1)</script>' })} />);
    expect(screen.getByText('표시할 수 없는 와이어프레임입니다.')).toBeInTheDocument();
  });

  it('mounts the rough overlay as hidden decoration without crashing in jsdom', () => {
    const { container } = render(<WireframeBlock block={wireframe()} />);
    const overlay = container.querySelector('svg.wf-rough-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay?.getAttribute('aria-hidden')).toBe('true');
  });

  it('prevents form submission from navigating', () => {
    const { container } = render(
      <WireframeBlock
        block={wireframe({ html: '<form><button type="submit">전송</button></form>' })}
      />,
    );
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
    expect(fireEvent.submit(form as HTMLFormElement)).toBe(false);
  });

  it('prevents anchor clicks from navigating', () => {
    const { container } = render(
      <WireframeBlock block={wireframe({ html: '<p><a>자세히 보기</a></p>' })} />,
    );
    const anchor = container.querySelector('.wf-root a');
    expect(anchor).toBeInTheDocument();
    expect(fireEvent.click(anchor as Element)).toBe(false);
  });
});
