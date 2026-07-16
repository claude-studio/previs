import '@testing-library/jest-dom/vitest';

// jsdom은 matchMedia를 구현하지 않는다 — ThemeToggle의 시스템 테마 감지용 스텁.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  class DeterministicResizeObserver implements ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      void callback;
    }

    disconnect() {}

    observe() {}

    unobserve() {}
  }

  globalThis.ResizeObserver = DeterministicResizeObserver;
}
