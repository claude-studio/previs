import kitchenSink from '@previs/schema/fixtures/kitchen-sink.json';
import samplePlan from '@previs/schema/fixtures/sample-plan.json';
import sampleRecap from '@previs/schema/fixtures/sample-recap.json';
import {
  safeParsePrevisDocument,
  type PrevisDocument,
} from '@previs/schema';

export type DocumentOrigin = 'builtin' | 'opened';

export interface DocumentEntry {
  document: PrevisDocument;
  origin: DocumentOrigin;
}

export type DocumentParseResult =
  | { success: true; entry: DocumentEntry }
  | { success: false; error: string };

const builtinInputs: unknown[] = [samplePlan, sampleRecap, kitchenSink];

function formatIssues(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues
    .slice(0, 3)
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'document';
      return `${path}: ${issue.message}`;
    })
    .join(' · ');
}

export function parseDocument(
  input: unknown,
  origin: DocumentOrigin = 'opened',
): DocumentParseResult {
  const result = safeParsePrevisDocument(input);

  if (!result.success) {
    return {
      success: false,
      error: formatIssues(result.error.issues),
    };
  }

  return {
    success: true,
    entry: {
      document: result.data,
      origin,
    },
  };
}

export async function parseDocumentFile(file: File): Promise<DocumentParseResult> {
  try {
    return parseDocument(JSON.parse(await file.text()));
  } catch {
    return {
      success: false,
      error: 'JSON 파일을 읽을 수 없습니다. 유효한 JSON 문서를 선택해 주세요.',
    };
  }
}

export const builtinDocuments: DocumentEntry[] = builtinInputs.flatMap((input) => {
  const result = parseDocument(input, 'builtin');
  return result.success ? [result.entry] : [];
});
