import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router';

import {
  builtinDocuments,
  fetchPublishedDocuments,
  parseDocumentFile,
  type DocumentEntry,
} from './lib/documents';
import { documentRouteKey } from './lib/route-key';
import { DocumentList } from './components/app/DocumentList';
import { DocumentView } from './components/app/DocumentView';

function ViewerRoutes({
  documents,
  fileError,
  publishedError,
  onFiles,
}: {
  documents: DocumentEntry[];
  fileError: string | null;
  publishedError: string | null;
  onFiles: (files: File[]) => Promise<string | null>;
}) {
  const navigate = useNavigate();

  const handleFiles = async (files: File[]) => {
    const documentId = await onFiles(files);

    if (documentId) {
      navigate(`/doc/${documentRouteKey(documentId)}`);
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <DocumentList
            documents={documents}
            fileError={fileError}
            publishedError={publishedError}
            onFiles={handleFiles}
          />
        }
      />
      <Route path="/doc/:id" element={<DocumentView documents={documents} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const originPriority = {
  builtin: 0,
  published: 1,
  opened: 2,
} as const;

function mergeDocuments(
  builtin: DocumentEntry[],
  published: DocumentEntry[],
  opened: DocumentEntry[],
): DocumentEntry[] {
  const merged = new Map<string, DocumentEntry>();

  for (const entry of [...builtin, ...published, ...opened]) {
    const id = entry.document.id;
    const current = merged.get(id);

    if (!current || originPriority[entry.origin] > originPriority[current.origin]) {
      merged.set(id, entry);
    }
  }

  return [...merged.values()];
}

export default function App() {
  const [openedDocuments, setOpenedDocuments] = useState<DocumentEntry[]>([]);
  const [publishedDocuments, setPublishedDocuments] = useState<DocumentEntry[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [publishedError, setPublishedError] = useState<string | null>(null);
  const refreshInFlight = useRef<Promise<void> | null>(null);

  const documents = useMemo(
    () => mergeDocuments(builtinDocuments, publishedDocuments, openedDocuments),
    [openedDocuments, publishedDocuments],
  );

  const refreshPublished = useCallback(async () => {
    if (refreshInFlight.current) {
      return refreshInFlight.current;
    }

    const request = fetchPublishedDocuments()
      .then((result) => {
        if (!result.ok) {
          setPublishedError(result.message);
          return;
        }

        setPublishedDocuments(result.entries);
        setPublishedError(
          result.errors.length > 0
            ? `일부 발행 문서를 읽지 못했습니다: ${result.errors.join(' · ')}`
            : null,
        );
      })
      .finally(() => {
        refreshInFlight.current = null;
      });

    refreshInFlight.current = request;
    return request;
  }, []);

  useEffect(() => {
    void refreshPublished();

    const handleFocus = () => {
      void refreshPublished();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshPublished]);

  const onFiles = useCallback(async (files: File[]): Promise<string | null> => {
    const file = files[0];

    if (!file) {
      return null;
    }

    const result = await parseDocumentFile(file);

    if (!result.success) {
      setFileError(result.error);
      return null;
    }

    setFileError(null);
    setOpenedDocuments((current) => {
      const existingIndex = current.findIndex(
        ({ document }) => document.id === result.entry.document.id,
      );

      if (existingIndex === -1) {
        return [...current, result.entry];
      }

      return current.map((entry, index) => (index === existingIndex ? result.entry : entry));
    });

    return result.entry.document.id;
  }, []);

  return (
    <BrowserRouter>
      <ViewerRoutes
        documents={documents}
        fileError={fileError}
        onFiles={onFiles}
        publishedError={publishedError}
      />
    </BrowserRouter>
  );
}
