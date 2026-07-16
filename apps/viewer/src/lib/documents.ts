import kitchenSink from '@previs/schema/fixtures/kitchen-sink.json';
import samplePlan from '@previs/schema/fixtures/sample-plan.json';
import sampleRecap from '@previs/schema/fixtures/sample-recap.json';
import { safeParsePrevisDocument, type PrevisDocument } from '@previs/schema';

import type { PublishedDocumentsPayload } from '../../shared/documents-api';

export type DocumentOrigin = 'builtin' | 'opened' | 'published';

export interface DocumentEntry {
  document: PrevisDocument;
  origin: DocumentOrigin;
}

export type DocumentParseResult =
  { success: true; entry: DocumentEntry } | { success: false; error: string };

export type PublishedFetchResult =
  { ok: true; entries: DocumentEntry[]; errors: string[] } | { ok: false; message: string };

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

function isPublishedDocumentsPayload(input: unknown): input is PublishedDocumentsPayload {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const payload = input as Partial<PublishedDocumentsPayload>;

  return (
    Array.isArray(payload.documents) &&
    payload.documents.every(
      (document) =>
        Boolean(document) &&
        typeof document === 'object' &&
        typeof document.fileName === 'string' &&
        typeof document.mtimeMs === 'number' &&
        Number.isFinite(document.mtimeMs) &&
        'raw' in document,
    ) &&
    Array.isArray(payload.errors) &&
    payload.errors.every(
      (error) =>
        Boolean(error) &&
        typeof error === 'object' &&
        typeof error.fileName === 'string' &&
        typeof error.message === 'string',
    )
  );
}

export async function fetchPublishedDocuments(): Promise<PublishedFetchResult> {
  let response: Response;

  try {
    response = await fetch('/api/documents');
  } catch {
    return {
      ok: false,
      message: '발행 문서를 새로고침할 수 없습니다. 뷰어 서버 연결을 확인해 주세요.',
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      message: `발행 문서 새로고침에 실패했습니다. (HTTP ${response.status})`,
    };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      message: '발행 문서 새로고침 응답을 읽을 수 없습니다.',
    };
  }

  if (!isPublishedDocumentsPayload(payload)) {
    return {
      ok: false,
      message: '발행 문서 새로고침 응답 형식이 올바르지 않습니다.',
    };
  }

  const entries: DocumentEntry[] = [];
  const errors = payload.errors.map(({ fileName, message }) => `${fileName}: ${message}`);

  for (const document of payload.documents) {
    const result = parseDocument(document.raw, 'published');

    if (result.success) {
      entries.push(result.entry);
    } else {
      errors.push(`${document.fileName}: ${result.error}`);
    }
  }

  return { ok: true, entries, errors };
}

export const builtinDocuments: DocumentEntry[] = builtinInputs.flatMap((input) => {
  const result = parseDocument(input, 'builtin');
  return result.success ? [result.entry] : [];
});
