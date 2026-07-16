import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { parsePrevisDocument, safeParsePrevisDocument } from './index.js';

const fixtures = ['sample-plan', 'sample-recap', 'kitchen-sink'] as const;

async function loadFixture(name: string): Promise<unknown> {
  const raw = await readFile(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8');
  return JSON.parse(raw) as unknown;
}

describe('fixture round-trip', () => {
  for (const name of fixtures) {
    it(`parses ${name}.json`, async () => {
      const document = parsePrevisDocument(await loadFixture(name));
      expect(document.blocks.length).toBeGreaterThan(0);
    });
  }
});

describe('public parse helpers', () => {
  it('parsePrevisDocument throws on invalid input', () => {
    expect(() => parsePrevisDocument({})).toThrow();
  });

  it('safeParsePrevisDocument reports failure without throwing', () => {
    expect(safeParsePrevisDocument({}).success).toBe(false);
  });
});
