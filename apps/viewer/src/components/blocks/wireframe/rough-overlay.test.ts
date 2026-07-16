import { describe, expect, it } from 'vitest';

import {
  collectSketchTargets,
  rectsToSketchShapes,
  seedFromBlockId,
  type MeasuredRect,
} from './rough-overlay';

function rect(left: number, top: number, width: number, height: number): MeasuredRect {
  return { left, top, width, height };
}

describe('seedFromBlockId', () => {
  it('is deterministic for the same block id', () => {
    expect(seedFromBlockId('sink-wireframe')).toBe(seedFromBlockId('sink-wireframe'));
  });

  it('differs across block ids and stays positive', () => {
    const a = seedFromBlockId('block-a');
    const b = seedFromBlockId('block-b');
    expect(a).not.toBe(b);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(0);
    expect(seedFromBlockId('')).toBeGreaterThan(0);
  });
});

describe('rectsToSketchShapes', () => {
  const containerRect = rect(100, 50, 400, 300);

  it('marks the first rect as the frame and offsets by the container origin', () => {
    const shapes = rectsToSketchShapes([containerRect, rect(120, 80, 200, 40)], containerRect);
    expect(shapes).toEqual([
      { kind: 'frame', x: 0, y: 0, width: 400, height: 300 },
      { kind: 'element', x: 20, y: 30, width: 200, height: 40 },
    ]);
  });

  it('drops zero-sized rects (jsdom measurements)', () => {
    const shapes = rectsToSketchShapes(
      [rect(0, 0, 0, 0), rect(10, 10, 0, 40), rect(10, 10, 40, 0)],
      rect(0, 0, 0, 0),
    );
    expect(shapes).toEqual([]);
  });
});

describe('collectSketchTargets', () => {
  it('collects boxy wireframe elements but not text nodes', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<section><p>본문</p><button>확인</button></section><span class="wf-image-placeholder">img</span>';
    const targets = collectSketchTargets(root);
    const tagNames = targets.map((target) => target.tagName.toLowerCase());
    expect(tagNames).toContain('section');
    expect(tagNames).toContain('button');
    expect(tagNames).not.toContain('p');
    expect(targets.some((target) => target.classList.contains('wf-image-placeholder'))).toBe(true);
  });
});
