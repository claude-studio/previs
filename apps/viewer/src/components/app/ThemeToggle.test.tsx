import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('toggles the dark class on <html> and persists the choice', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem('previs-theme')).toBe('dark');

    fireEvent.click(button);
    expect(document.documentElement).not.toHaveClass('dark');
    expect(window.localStorage.getItem('previs-theme')).toBe('light');
  });

  it('restores the stored theme on mount', () => {
    window.localStorage.setItem('previs-theme', 'dark');
    render(<ThemeToggle />);
    expect(document.documentElement).toHaveClass('dark');
  });
});
