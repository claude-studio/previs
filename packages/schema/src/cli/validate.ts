import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { safeParsePrevisDocument } from '../index.js';

function formatIssue(path: PropertyKey[], message: string): string {
  return `${path.length > 0 ? path.join('.') : 'document'}: ${message}`;
}

export async function validateDocumentFile(filePath: string): Promise<boolean> {
  let input: unknown;

  try {
    input = JSON.parse(await readFile(filePath, 'utf8')) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`file: ${message}`);
    return false;
  }

  const result = safeParsePrevisDocument(input);

  if (result.success) {
    return true;
  }

  for (const issue of result.error.issues) {
    console.error(formatIssue(issue.path, issue.message));
  }

  return false;
}

export async function main(args: string[]): Promise<number> {
  const [filePath, ...extraArguments] = args;

  if (!filePath || extraArguments.length > 0) {
    console.error('사용법: pnpm doc:validate <json-file>');
    return 1;
  }

  return (await validateDocumentFile(filePath)) ? 0 : 1;
}

const invokedFile = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;

if (invokedFile === import.meta.url) {
  process.exitCode = await main(process.argv.slice(2));
}
