import DOMPurify from 'dompurify';
import mermaid, { type MermaidConfig } from 'mermaid';

export const EXTERNAL_RESOURCE_MESSAGE = '외부 리소스를 참조하는 다이어그램은 지원되지 않습니다.';

export interface WireframeThemeTokens {
  canvas: string;
  surface: string;
  ink: string;
  line: string;
  muted: string;
  accent: string;
  chrome: string;
  fontBody: string;
}

export interface DiagramThemeVariables {
  [key: string]: string;
}

export interface DiagramRenderOptions {
  blockId: string;
  code: string;
  generation: number;
  isGenerationCurrent: (generation: number) => boolean;
  tokens: WireframeThemeTokens;
}

export type DiagramRenderResult =
  { status: 'success'; svg: string } | { status: 'external-resource' } | { status: 'stale' };

const fallbackTokens: WireframeThemeTokens = {
  canvas: '#f2eee8',
  surface: '#fffdf8',
  ink: '#24313b',
  line: '#8a969c',
  muted: '#68757c',
  accent: '#d8664f',
  chrome: '#e4ded5',
  fontBody: "'Chalkboard SE', 'Comic Sans MS', 'Pretendard Variable', sans-serif",
};

const tokenProperties: ReadonlyArray<readonly [keyof WireframeThemeTokens, string]> = [
  ['canvas', '--wf-canvas'],
  ['surface', '--wf-surface'],
  ['ink', '--wf-ink'],
  ['line', '--wf-line'],
  ['muted', '--wf-muted'],
  ['accent', '--wf-accent'],
  ['chrome', '--wf-chrome'],
  ['fontBody', '--wf-font-body'],
];

let mermaidInitialized = false;
let renderAttempt = 0;
let renderQueue = Promise.resolve();

function readComputedToken(
  styles: CSSStyleDeclaration,
  property: string,
  fallback: string,
): string {
  return styles.getPropertyValue(property).trim() || fallback;
}

export function readWireframeTokens(
  root: Element = document.documentElement,
): WireframeThemeTokens {
  const styles = getComputedStyle(root);
  const tokens = {} as WireframeThemeTokens;

  tokenProperties.forEach(([key, property]) => {
    tokens[key] = readComputedToken(styles, property, fallbackTokens[key]);
  });

  return tokens;
}

export function themeVariablesFromTokens(tokens: WireframeThemeTokens): DiagramThemeVariables {
  return {
    background: tokens.canvas,
    primaryColor: tokens.surface,
    primaryTextColor: tokens.ink,
    primaryBorderColor: tokens.line,
    lineColor: tokens.line,
    textColor: tokens.ink,
    secondaryColor: tokens.chrome,
    secondaryTextColor: tokens.ink,
    secondaryBorderColor: tokens.line,
    tertiaryColor: tokens.canvas,
    tertiaryTextColor: tokens.ink,
    tertiaryBorderColor: tokens.line,
    nodeBkg: tokens.surface,
    nodeBorder: tokens.line,
    mainBkg: tokens.surface,
    clusterBkg: tokens.canvas,
    clusterBorder: tokens.line,
    edgeLabelBackground: tokens.canvas,
    labelTextColor: tokens.ink,
    titleColor: tokens.ink,
    actorBkg: tokens.surface,
    actorBorder: tokens.line,
    actorTextColor: tokens.ink,
    signalColor: tokens.accent,
    signalTextColor: tokens.ink,
    noteBkgColor: tokens.chrome,
    noteTextColor: tokens.ink,
    noteBorderColor: tokens.line,
    fontFamily: tokens.fontBody,
  };
}

export function seedFromDiagramId(blockId: string): number {
  let hash = 2166136261;

  for (const character of blockId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) & 0x7fffffff || 1;
}

const frontmatterPattern = /^\s*---\r?\n[\s\S]*?\r?\n---\r?\n?/;
const initDirectivePattern = /%%\{[\s\S]*?\}%%\s*/g;

export function stripMermaidAuthorDirectives(code: string): string {
  return code.replace(frontmatterPattern, '').replace(initDirectivePattern, '').trim();
}

export function buildTrustedFrontmatter(
  themeVariables: DiagramThemeVariables,
  seed: number,
): string {
  const lines = [
    '---',
    'config:',
    '  theme: base',
    '  look: handDrawn',
    `  handDrawnSeed: ${seed}`,
    '  themeVariables:',
  ];

  Object.entries(themeVariables).forEach(([key, value]) => {
    lines.push(`    ${key}: ${JSON.stringify(value)}`);
  });

  lines.push('---');
  return lines.join('\n');
}

export function prepareMermaidCode(
  code: string,
  themeVariables: DiagramThemeVariables,
  seed: number,
): string {
  return `${buildTrustedFrontmatter(themeVariables, seed)}\n${stripMermaidAuthorDirectives(code)}`;
}

// 자산 키는 YAML 인용 키("img":)로도 표기될 수 있고, URL은 protocol-relative
// (//host)로도 가능하다 — 두 표기 모두 보수적으로 거부한다.
const externalResourcePatterns = [
  /["']?\b(?:img|image|icon|iconify)\b["']?\s*:/i,
  /\b(?:fa|fab|fas|far|mdi|logos|si|bi):[\w-]+/i,
  /url\s*\(/i,
  /\/\//,
  /\b(?:data|blob|file):/i,
];

export function hasExternalResourceReference(code: string): boolean {
  // @{…} 셰이프 메타데이터는 완전한 YAML로 해석된다 — 인용 키·\u 이스케이프·
  // anchor/alias 로 자산 키(img 등)를 raw 문자열 검사가 못 보게 조립할 수
  // 있어 메타데이터 블록 자체를 보수적으로 거부한다. 완화가 필요해지면
  // 해석된 YAML의 키 allowlist 검사로 후속 사이클에서 푼다.
  if (code.includes('@{')) {
    return true;
  }

  return externalResourcePatterns.some((pattern) => pattern.test(code));
}

function sanitizeExternalSvgReferences(svg: string): string {
  return svg
    .replace(/\s(?:href|xlink:href)=(['"])(?!#)[^'"]*\1/gi, '')
    .replace(/url\(\s*(?!#)[^)]+\)/gi, 'none');
}

export function sanitizeDiagramSvg(svg: string): string {
  const sanitized = DOMPurify.sanitize(svg, {
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ['foreignObject', 'script'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    USE_PROFILES: { svg: true, svgFilters: true },
  });

  return sanitizeExternalSvgReferences(sanitized);
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = renderQueue.then(task, task);
  renderQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function ensureMermaidInitialized(): void {
  if (mermaidInitialized) {
    return;
  }

  const secureConfig: MermaidConfig = {
    htmlLabels: false,
    securityLevel: 'strict',
    secure: ['securityLevel', 'startOnLoad', 'secure', 'htmlLabels'],
    startOnLoad: false,
    suppressErrorRendering: true,
  };
  mermaid.initialize(secureConfig);
  mermaidInitialized = true;
}

function renderDomId(blockId: string): string {
  const safeBlockId = blockId.replace(/[^a-zA-Z0-9_-]/g, '-');
  renderAttempt += 1;
  return `previs-diagram-${safeBlockId}-${renderAttempt}`;
}

export function renderDiagram(options: DiagramRenderOptions): Promise<DiagramRenderResult> {
  const source = stripMermaidAuthorDirectives(options.code);

  if (hasExternalResourceReference(source)) {
    return Promise.resolve({ status: 'external-resource' });
  }

  return enqueue(async () => {
    if (!options.isGenerationCurrent(options.generation)) {
      return { status: 'stale' };
    }

    ensureMermaidInitialized();
    const sourceCode = prepareMermaidCode(
      source,
      themeVariablesFromTokens(options.tokens),
      seedFromDiagramId(options.blockId),
    );
    const { svg } = await mermaid.render(renderDomId(options.blockId), sourceCode);

    if (!options.isGenerationCurrent(options.generation)) {
      return { status: 'stale' };
    }

    return { status: 'success', svg: sanitizeDiagramSvg(svg) };
  });
}
