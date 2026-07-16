import { describe, expect, it, vi } from 'vitest';

import {
  buildTrustedFrontmatter,
  hasExternalResourceReference,
  prepareMermaidCode,
  readWireframeTokens,
  renderDiagram,
  sanitizeDiagramSvg,
  seedFromDiagramId,
  stripMermaidAuthorDirectives,
  themeVariablesFromTokens,
  type WireframeThemeTokens,
} from './diagram-mermaid';

const mermaidSpies = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(async (id: string) => ({ svg: `<svg data-render-id="${id}"><g></g></svg>` })),
}));

vi.mock('mermaid', () => ({
  default: { initialize: mermaidSpies.initialize, render: mermaidSpies.render },
}));

const tokens: WireframeThemeTokens = {
  canvas: '#f2eee8',
  surface: '#fffdf8',
  ink: '#24313b',
  line: '#8a969c',
  muted: '#68757c',
  accent: '#d8664f',
  chrome: '#e4ded5',
  fontBody: 'sans-serif',
};

describe('seedFromDiagramId', () => {
  it('derives a deterministic positive seed from the block id', () => {
    expect(seedFromDiagramId('sink-diagram')).toBe(seedFromDiagramId('sink-diagram'));
    expect(seedFromDiagramId('sink-diagram')).toBeGreaterThan(0);
    expect(seedFromDiagramId('sink-diagram')).not.toBe(seedFromDiagramId('other-diagram'));
  });
});

describe('stripMermaidAuthorDirectives', () => {
  it('removes author frontmatter and init directives but keeps the body', () => {
    const code = [
      '---',
      'config:',
      '  theme: forest',
      '---',
      '%%{init: {"theme": "dark"}}%%',
      'flowchart LR',
      '  A --> B',
    ].join('\n');

    const stripped = stripMermaidAuthorDirectives(code);

    expect(stripped).not.toContain('forest');
    expect(stripped).not.toContain('%%{');
    expect(stripped).toContain('flowchart LR');
    expect(stripped).toContain('A --> B');
  });
});

describe('prepareMermaidCode', () => {
  it('prepends trusted frontmatter with handDrawn look, seed and theme variables', () => {
    const variables = themeVariablesFromTokens(tokens);
    const prepared = prepareMermaidCode('flowchart LR\n  A --> B', variables, 42);

    expect(prepared.startsWith('---\nconfig:')).toBe(true);
    expect(prepared).toContain('look: handDrawn');
    expect(prepared).toContain('handDrawnSeed: 42');
    expect(prepared).toContain('theme: base');
    expect(prepared).toContain(`background: ${JSON.stringify(tokens.canvas)}`);
    expect(prepared.endsWith('flowchart LR\n  A --> B')).toBe(true);
  });

  it('keeps only the trusted frontmatter when the author supplied one', () => {
    const variables = themeVariablesFromTokens(tokens);
    const prepared = prepareMermaidCode(
      buildTrustedFrontmatter(variables, 1).replace('base', 'forest') + '\nflowchart LR',
      variables,
      7,
    );

    expect(prepared).not.toContain('forest');
    expect(prepared).toContain('handDrawnSeed: 7');
  });
});

describe('themeVariablesFromTokens', () => {
  it('maps wireframe tokens onto mermaid theme variables', () => {
    const variables = themeVariablesFromTokens(tokens);

    expect(variables.background).toBe(tokens.canvas);
    expect(variables.primaryColor).toBe(tokens.surface);
    expect(variables.primaryTextColor).toBe(tokens.ink);
    expect(variables.lineColor).toBe(tokens.line);
    expect(variables.fontFamily).toBe(tokens.fontBody);
  });
});

describe('readWireframeTokens', () => {
  it('falls back to the default palette when tokens are not defined', () => {
    const read = readWireframeTokens(document.createElement('div'));

    expect(read.canvas).toBe('#f2eee8');
    expect(read.ink).toBe('#24313b');
  });
});

describe('hasExternalResourceReference', () => {
  it.each([
    ['image node metadata', 'flowchart LR\n  A@{ img: "https://example.com/x.png" }'],
    ['quoted image key', 'flowchart LR\n  A@{ "img": "//attacker.example/pixel.png" }'],
    [
      'yaml-escaped image key',
      'flowchart LR\n  A@{ "i\\u006dg": "https:\\u002f\\u002fattacker.example/pixel.png" }',
    ],
    [
      'yaml anchor/alias image key',
      'flowchart LR\n  A@{ helper: &asset img, *asset : "https:attacker.example/pixel.png" }',
    ],
    ['any shape metadata (conservative)', 'flowchart LR\n  A@{ shape: cylinder } --> B'],
    ['protocol-relative url', 'flowchart LR\n  A[//cdn.example/x.png] --> B'],
    ['icon shorthand', 'flowchart LR\n  A@{ icon: "fa:user" }'],
    ['css url function', 'flowchart LR\n  A --> B\nclassDef a fill:url(#gradient)'],
    ['url scheme literal', 'flowchart LR\n  A[https://example.com] --> B'],
    ['data scheme literal', 'flowchart LR\n  A[data:image/png;base64,AAAA] --> B'],
  ])('rejects %s', (_label, code) => {
    expect(hasExternalResourceReference(code)).toBe(true);
  });

  it('accepts plain diagrams without resource syntax', () => {
    expect(
      hasExternalResourceReference(
        'flowchart LR; Agent[코딩 에이전트] -->|JSON 블록 발행| Local[.previs/ 로컬 문서]',
      ),
    ).toBe(false);
  });
});

describe('sanitizeDiagramSvg', () => {
  it('drops external references and scripts while keeping internal ones', () => {
    const sanitized = sanitizeDiagramSvg(
      [
        '<svg>',
        '<image href="https://evil.example/x.png"></image>',
        '<a href="#internal"><text>ok</text></a>',
        '<rect style="fill:url(https://evil.example)"></rect>',
        '<rect style="fill:url(#safe)"></rect>',
        '<script>alert(1)</script>',
        '</svg>',
      ].join(''),
    );

    expect(sanitized).not.toContain('evil.example');
    expect(sanitized).not.toContain('<script');
    expect(sanitized).toContain('#internal');
    expect(sanitized).toContain('url(#safe)');
  });
});

describe('renderDiagram', () => {
  const baseOptions = {
    generation: 0,
    isGenerationCurrent: () => true,
    tokens,
  };

  it('refuses external-resource diagrams without calling mermaid', async () => {
    mermaidSpies.render.mockClear();

    const result = await renderDiagram({
      ...baseOptions,
      blockId: 'blocked',
      code: 'flowchart LR\n  A[https://example.com] --> B',
    });

    expect(result).toEqual({ status: 'external-resource' });
    expect(mermaidSpies.render).not.toHaveBeenCalled();
  });

  it('refuses quoted-key protocol-relative image metadata without calling mermaid', async () => {
    mermaidSpies.render.mockClear();

    const result = await renderDiagram({
      ...baseOptions,
      blockId: 'blocked-quoted',
      code: 'flowchart LR\n  A@{ "img": "//attacker.example/pixel.png" }',
    });

    expect(result).toEqual({ status: 'external-resource' });
    expect(mermaidSpies.render).not.toHaveBeenCalled();
  });

  it('refuses yaml-escaped image metadata without calling mermaid', async () => {
    mermaidSpies.render.mockClear();

    const result = await renderDiagram({
      ...baseOptions,
      blockId: 'blocked-escaped',
      code: 'flowchart LR\n  A@{ "i\\u006dg": "https:\\u002f\\u002fattacker.example/pixel.png" }',
    });

    expect(result).toEqual({ status: 'external-resource' });
    expect(mermaidSpies.render).not.toHaveBeenCalled();
  });

  it('refuses anchor/alias-assembled image metadata without calling mermaid', async () => {
    mermaidSpies.render.mockClear();

    const result = await renderDiagram({
      ...baseOptions,
      blockId: 'blocked-alias',
      code: 'flowchart LR\n  A@{ helper: &asset img, *asset : "https:attacker.example/pixel.png" }',
    });

    expect(result).toEqual({ status: 'external-resource' });
    expect(mermaidSpies.render).not.toHaveBeenCalled();
  });

  it('skips rendering when the generation is already stale', async () => {
    mermaidSpies.render.mockClear();

    const result = await renderDiagram({
      ...baseOptions,
      blockId: 'stale',
      code: 'flowchart LR\n  A --> B',
      isGenerationCurrent: () => false,
    });

    expect(result).toEqual({ status: 'stale' });
    expect(mermaidSpies.render).not.toHaveBeenCalled();
  });

  it('discards results that finished after the generation changed', async () => {
    let current = true;
    mermaidSpies.render.mockImplementationOnce(async (id: string) => {
      current = false;
      return { svg: `<svg data-render-id="${id}"></svg>` };
    });

    const result = await renderDiagram({
      ...baseOptions,
      blockId: 'flipped',
      code: 'flowchart LR\n  A --> B',
      isGenerationCurrent: () => current,
    });

    expect(result).toEqual({ status: 'stale' });
  });

  it('renders successfully with unique DOM ids per attempt', async () => {
    mermaidSpies.render.mockClear();

    const first = await renderDiagram({
      ...baseOptions,
      blockId: 'same-block',
      code: 'flowchart LR\n  A --> B',
    });
    const second = await renderDiagram({
      ...baseOptions,
      blockId: 'same-block',
      code: 'flowchart LR\n  A --> B',
    });

    expect(first.status).toBe('success');
    expect(second.status).toBe('success');
    const [firstId] = mermaidSpies.render.mock.calls[0];
    const [secondId] = mermaidSpies.render.mock.calls[1];
    expect(firstId).not.toBe(secondId);
    expect(mermaidSpies.initialize).toHaveBeenCalledTimes(1);
  });

  it('serializes concurrent renders through the queue', async () => {
    mermaidSpies.render.mockClear();
    let releaseFirst: () => void = () => undefined;
    mermaidSpies.render.mockImplementationOnce(async (id: string) => {
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      return { svg: `<svg data-render-id="${id}"></svg>` };
    });

    const first = renderDiagram({
      ...baseOptions,
      blockId: 'queued-1',
      code: 'flowchart LR\n  A --> B',
    });
    const second = renderDiagram({
      ...baseOptions,
      blockId: 'queued-2',
      code: 'flowchart LR\n  A --> B',
    });

    await vi.waitFor(() => {
      expect(mermaidSpies.render).toHaveBeenCalledTimes(1);
    });
    releaseFirst();
    await Promise.all([first, second]);
    expect(mermaidSpies.render).toHaveBeenCalledTimes(2);
  });
});
