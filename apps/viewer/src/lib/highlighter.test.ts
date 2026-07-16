import { describe, expect, it, vi } from 'vitest';

import { highlightCode } from './highlighter';

const shikiSpies = vi.hoisted(() => {
  const codeToHtml = vi.fn(
    (code: string, options: { lang: string }) =>
      `<pre class="shiki" data-lang="${options.lang}"><code>${code}</code></pre>`,
  );
  // 실제 shiki는 번들 밖 언어에서 rejected promise가 아니라 동기 예외를 던진다.
  const loadLanguage = vi.fn((lang: string): Promise<void> => {
    if (lang === 'no-such-lang') {
      throw new Error('unknown language');
    }
    return Promise.resolve();
  });
  const createHighlighter = vi.fn(async () => ({ codeToHtml, loadLanguage }));

  return { codeToHtml, loadLanguage, createHighlighter };
});

vi.mock('shiki', () => ({ createHighlighter: shikiSpies.createHighlighter }));

describe('highlightCode', () => {
  it('renders diff without dynamic language loading', async () => {
    const html = await highlightCode('+added', { lang: 'diff' });

    expect(html).toContain('data-lang="diff"');
    expect(shikiSpies.loadLanguage).not.toHaveBeenCalled();
  });

  it('loads a requested language once and caches it', async () => {
    await highlightCode('const a = 1;', { lang: 'typescript' });
    await highlightCode('const b = 2;', { lang: 'TypeScript' });

    const typescriptLoads = shikiSpies.loadLanguage.mock.calls.filter(
      ([lang]) => lang === 'typescript',
    );
    expect(typescriptLoads).toHaveLength(1);
    expect(shikiSpies.codeToHtml).toHaveBeenLastCalledWith(
      'const b = 2;',
      expect.objectContaining({ lang: 'typescript' }),
    );
  });

  it('falls back to plaintext for unknown languages', async () => {
    const html = await highlightCode('mystery', { lang: 'no-such-lang' });

    expect(html).toContain('data-lang="text"');
  });

  it('reuses a single highlighter instance across calls', async () => {
    await highlightCode('one', { lang: 'diff' });
    await highlightCode('two', { lang: 'text' });

    expect(shikiSpies.createHighlighter).toHaveBeenCalledTimes(1);
  });
});
