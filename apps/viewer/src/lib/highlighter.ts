import type { BundledLanguage, Highlighter, ShikiTransformer } from 'shiki';

export const SHIKI_THEMES = {
  light: 'github-light',
  dark: 'github-dark',
} as const;

export type CodeHighlightTransformer = ShikiTransformer;

export interface HighlightCodeOptions {
  lang: string;
  transformers?: readonly CodeHighlightTransformer[];
}

let highlighterPromise: Promise<Highlighter> | undefined;
const languagePromises = new Map<string, Promise<string>>();

export function getHighlighter() {
  highlighterPromise ??= import('shiki').then(({ createHighlighter }) =>
    createHighlighter({
      langs: ['diff'],
      themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
    }),
  );

  return highlighterPromise;
}

function normalizeLanguage(lang: string): string {
  const normalized = lang.trim().toLowerCase();

  if (normalized === 'plaintext' || normalized === 'plain' || normalized === 'txt') {
    return 'text';
  }

  return normalized || 'text';
}

async function resolveLanguage(highlighter: Highlighter, lang: string): Promise<string> {
  const normalized = normalizeLanguage(lang);

  if (normalized === 'text' || normalized === 'diff') {
    return normalized;
  }

  const pending = languagePromises.get(normalized);

  if (pending) {
    return pending;
  }

  // shiki는 번들에 없는 언어에서 rejected promise가 아니라 동기 예외를 던진다.
  const loading = Promise.resolve()
    .then(() => highlighter.loadLanguage(normalized as BundledLanguage))
    .then(() => normalized)
    .catch(() => 'text');
  languagePromises.set(normalized, loading);

  return loading;
}

export async function highlightCode(code: string, options: HighlightCodeOptions): Promise<string> {
  const highlighter = await getHighlighter();
  const lang = await resolveLanguage(highlighter, options.lang);
  const highlightOptions = {
    lang: lang as BundledLanguage,
    themes: SHIKI_THEMES,
    ...(options.transformers?.length ? { transformers: [...options.transformers] } : {}),
  };

  try {
    return highlighter.codeToHtml(code, highlightOptions);
  } catch {
    if (lang === 'text') {
      throw new Error('Unable to render highlighted code');
    }

    return highlighter.codeToHtml(code, {
      lang: 'text' as BundledLanguage,
      themes: SHIKI_THEMES,
      ...(options.transformers?.length ? { transformers: [...options.transformers] } : {}),
    });
  }
}
