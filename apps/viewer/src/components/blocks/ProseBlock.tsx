import ReactMarkdown from 'react-markdown';

import type { ProseBlock as ProseBlockData } from '@previs/schema';

export function ProseBlock({ block }: { block: ProseBlockData }) {
  return (
    <article className="document-markdown text-base leading-7 text-charcoal">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-5 text-3xl font-semibold tracking-tight text-ink">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 mt-8 text-2xl font-semibold tracking-tight text-ink">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-6 text-xl font-semibold text-ink">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-primary pl-4 text-steel">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-surface-soft px-1.5 py-0.5 font-mono text-[0.9em] text-ink">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a
              className="font-medium text-info underline decoration-info/40 underline-offset-2 hover:decoration-info"
              href={href}
              rel="noreferrer"
              target="_blank"
            >
              {children}
            </a>
          ),
        }}
      >
        {block.markdown}
      </ReactMarkdown>
    </article>
  );
}
