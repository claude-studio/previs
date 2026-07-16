import { describe, expect, it } from 'vitest';

import { diagramSchema } from './diagram.js';

describe('diagramSchema', () => {
  it('accepts a mermaid diagram', () => {
    const result = diagramSchema.safeParse({
      id: 'dg1',
      type: 'diagram',
      engine: 'mermaid',
      code: 'flowchart LR\n  A --> B',
      caption: '발행 흐름',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown engine', () => {
    const result = diagramSchema.safeParse({
      id: 'dg1',
      type: 'diagram',
      engine: 'plantuml',
      code: '@startuml',
    });
    expect(result.success).toBe(false);
  });
});
