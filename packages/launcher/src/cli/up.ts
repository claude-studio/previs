import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { launch } from '../launch.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export async function main(): Promise<number> {
  try {
    const result = await launch({ projectRoot, env: process.env });
    console.log(result.url);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

const invokedFile = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;

if (invokedFile === import.meta.url) {
  process.exitCode = await main();
}
