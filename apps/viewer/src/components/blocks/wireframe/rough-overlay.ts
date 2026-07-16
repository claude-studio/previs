import rough from 'roughjs';

export const SKETCH_TARGET_SELECTOR = [
  'article',
  'aside',
  'button',
  'details',
  'fieldset',
  'figure',
  'form',
  'header',
  'hr',
  'input',
  'main',
  'nav',
  'section',
  'select',
  'table',
  'textarea',
  '.wf-image-placeholder',
].join(', ');

export interface MeasuredRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SketchShape {
  kind: 'element' | 'frame';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoughOverlayMountOptions {
  blockId: string;
  container: HTMLElement;
  root: HTMLElement;
}

export function seedFromBlockId(blockId: string): number {
  let hash = 2166136261;

  for (const character of blockId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) & 0x7fffffff || 1;
}

export function collectSketchTargets(root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll(SKETCH_TARGET_SELECTOR));
}

export function rectToMeasuredRect(rect: DOMRect): MeasuredRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function rectsToSketchShapes(
  rects: readonly MeasuredRect[],
  containerRect: MeasuredRect,
): SketchShape[] {
  return rects.flatMap((rect, index) => {
    const width = Math.max(0, rect.width);
    const height = Math.max(0, rect.height);

    if (width === 0 || height === 0) {
      return [];
    }

    return [
      {
        kind: index === 0 ? 'frame' : 'element',
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width,
        height,
      },
    ];
  });
}

function measureTargets(targets: readonly Element[]): MeasuredRect[] {
  return targets.map((target) => rectToMeasuredRect(target.getBoundingClientRect()));
}

function overlaySize(container: HTMLElement, containerRect: MeasuredRect) {
  return {
    width: Math.max(1, Math.ceil(Math.max(container.clientWidth, containerRect.width))),
    height: Math.max(
      1,
      Math.ceil(Math.max(container.clientHeight, container.scrollHeight, containerRect.height)),
    ),
  };
}

function drawOverlay(svg: SVGSVGElement, options: RoughOverlayMountOptions, seed: number): void {
  const containerRect = rectToMeasuredRect(options.container.getBoundingClientRect());
  const size = overlaySize(options.container, containerRect);
  const targetRects = measureTargets(collectSketchTargets(options.root));
  const shapes = rectsToSketchShapes([containerRect, ...targetRects], containerRect);

  svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
  svg.setAttribute('width', `${size.width}`);
  svg.setAttribute('height', `${size.height}`);

  const renderer = rough.svg(svg, { options: { seed } });

  shapes.forEach((shape) => {
    const group = renderer.rectangle(shape.x, shape.y, shape.width, shape.height, {
      fill: 'var(--wf-surface)',
      fillStyle: 'solid',
      roughness: shape.kind === 'frame' ? 0.8 : 1.1,
      stroke: 'var(--wf-ink)',
      strokeWidth: shape.kind === 'frame' ? 1.7 : 1.2,
    });

    group.classList.add(shape.kind === 'frame' ? 'wf-rough-frame' : 'wf-rough-element');
    svg.append(group);
  });
}

export function mountRoughOverlay({
  blockId,
  container,
  root,
}: RoughOverlayMountOptions): () => void {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  svg.classList.add('wf-rough-overlay');
  svg.setAttribute('aria-hidden', 'true');

  container.append(svg);

  const seed = seedFromBlockId(blockId);
  const redraw = () => drawOverlay(svg, { blockId, container, root }, seed);

  redraw();

  let observer: ResizeObserver | undefined;

  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(redraw);
    observer.observe(container);
  }

  return () => {
    observer?.disconnect();
    svg.remove();
  };
}
