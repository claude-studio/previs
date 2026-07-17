import { describe, expect, it } from 'vitest';

import type { Block } from './block.js';
import { MAX_CONTAINER_DEPTH, previsDocumentSchema } from './document.js';

const prose = (id: string): Block => ({ id, type: 'prose', markdown: '내용' });

function nestedTabs(depth: number): Block {
  let block: Block = prose('leaf');
  for (let level = depth; level >= 1; level -= 1) {
    block = {
      id: `tabs-${level}`,
      type: 'tabs',
      items: [{ label: `레벨 ${level}`, blocks: [block] }],
    };
  }
  return block;
}

const doc = (blocks: Block[], overrides: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  id: 'doc-1',
  kind: 'plan',
  title: '샘플 문서',
  createdAt: '2026-07-16T12:00:00+09:00',
  blocks,
  ...overrides,
});

describe('previsDocumentSchema', () => {
  it('accepts a minimal document', () => {
    expect(previsDocumentSchema.safeParse(doc([prose('p1')])).success).toBe(true);
  });

  it('accepts a recap document with source metadata', () => {
    const result = previsDocumentSchema.safeParse(
      doc([prose('p1')], {
        kind: 'recap',
        source: { branch: 'feat/foo', commitRange: 'abc123..def456', pr: 42 },
      }),
    );
    expect(result.success).toBe(true);
  });

  it.each(['range', 'staged', 'worktree'])('accepts source.mode "%s"', (mode) => {
    const result = previsDocumentSchema.safeParse(
      doc([prose('p1')], { kind: 'recap', source: { branch: 'feat/foo', mode } }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts source without mode (backward compatible)', () => {
    const result = previsDocumentSchema.safeParse(
      doc([prose('p1')], { kind: 'recap', source: { branch: 'feat/foo' } }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects an unknown source.mode', () => {
    const result = previsDocumentSchema.safeParse(
      doc([prose('p1')], { kind: 'recap', source: { mode: 'rebase' } }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects empty blocks', () => {
    expect(previsDocumentSchema.safeParse(doc([])).success).toBe(false);
  });

  it('rejects a missing title', () => {
    expect(previsDocumentSchema.safeParse(doc([prose('p1')], { title: undefined })).success).toBe(
      false,
    );
  });

  it('rejects createdAt without timezone', () => {
    const result = previsDocumentSchema.safeParse(
      doc([prose('p1')], { createdAt: '2026-07-16T12:00:00' }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts createdAt in UTC (Z suffix)', () => {
    const result = previsDocumentSchema.safeParse(
      doc([prose('p1')], { createdAt: '2026-07-16T03:00:00Z' }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects an unknown block type', () => {
    const result = previsDocumentSchema.safeParse(
      doc([{ id: 'x1', type: 'video' } as unknown as Block]),
    );
    expect(result.success).toBe(false);
  });

  it('rejects duplicate block ids across nesting levels', () => {
    const tabs: Block = {
      id: 't1',
      type: 'tabs',
      items: [{ label: '탭', blocks: [prose('p1')] }],
    };
    expect(previsDocumentSchema.safeParse(doc([prose('p1'), tabs])).success).toBe(false);
  });

  it(`accepts container nesting up to depth ${MAX_CONTAINER_DEPTH}`, () => {
    const result = previsDocumentSchema.safeParse(doc([nestedTabs(MAX_CONTAINER_DEPTH)]));
    expect(result.success).toBe(true);
  });

  it(`rejects container nesting beyond depth ${MAX_CONTAINER_DEPTH}`, () => {
    const result = previsDocumentSchema.safeParse(doc([nestedTabs(MAX_CONTAINER_DEPTH + 1)]));
    expect(result.success).toBe(false);
  });
});
