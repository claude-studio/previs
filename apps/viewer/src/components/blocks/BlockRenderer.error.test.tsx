import type { Block } from '@previs/schema';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BlockRenderer } from './BlockRenderer';

vi.mock('./wireframe/WireframeBlock', () => {
  throw new Error('chunk load failed');
});

describe('BlockRenderer wireframe chunk failure', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an inline error with reload recovery instead of crashing the viewer', async () => {
    const block: Block = {
      id: 'wf-broken',
      type: 'wireframe',
      surface: 'browser',
      html: '<main><h1>화면</h1></main>',
    };
    render(<BlockRenderer block={block} />);
    expect(
      await screen.findByText('와이어프레임 렌더러를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument();
  });
});
