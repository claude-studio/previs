import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

// dist가 있어야 통과한다 — 루트 `pnpm test`는 빌드를 선행하며, 단독 실행 시 `pnpm build`가 먼저 필요.
describe('dist ESM smoke', () => {
  it('parses the kitchen-sink fixture through the built package', async () => {
    const dist = (await import(new URL('../dist/index.js', import.meta.url).href)) as {
      parsePrevisDocument: (input: unknown) => { kind: string };
    };
    const raw = await readFile(new URL('../fixtures/kitchen-sink.json', import.meta.url), 'utf8');
    const document = dist.parsePrevisDocument(JSON.parse(raw));
    expect(document.kind).toBe('plan');
  });
});
