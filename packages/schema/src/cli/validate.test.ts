import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './validate.js';

const samplePlanPath = fileURLToPath(
  new URL('../../fixtures/sample-plan.json', import.meta.url),
);

describe('doc:validate CLI', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('returns 0 for a schema-valid document', async () => {
    await expect(main([samplePlanPath])).resolves.toBe(0);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('returns 1 and prints issues for a schema-invalid document', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'previs-validate-'));
    const filePath = path.join(directory, 'invalid.json');
    await writeFile(filePath, JSON.stringify({ kind: 'plan' }));

    await expect(main([filePath])).resolves.toBe(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('returns 1 for a file that is not valid JSON', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'previs-validate-'));
    const filePath = path.join(directory, 'broken.json');
    await writeFile(filePath, '{');

    await expect(main([filePath])).resolves.toBe(1);
  });

  it('returns 1 with usage output when arguments are wrong', async () => {
    await expect(main([])).resolves.toBe(1);
    await expect(main(['a.json', 'b.json'])).resolves.toBe(1);
  });
});
