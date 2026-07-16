import { useCallback, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router';

import {
  builtinDocuments,
  parseDocumentFile,
  type DocumentEntry,
} from './lib/documents';
import { documentRouteKey } from './lib/route-key';
import { DocumentList } from './components/app/DocumentList';
import { DocumentView } from './components/app/DocumentView';

function ViewerRoutes({
  documents,
  fileError,
  onFiles,
}: {
  documents: DocumentEntry[];
  fileError: string | null;
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
            onFiles={handleFiles}
          />
        }
      />
      <Route
        path="/doc/:id"
        element={<DocumentView documents={documents} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [documents, setDocuments] = useState<DocumentEntry[]>(builtinDocuments);
  const [fileError, setFileError] = useState<string | null>(null);

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
    setDocuments((current) => {
      const existingIndex = current.findIndex(
        ({ document }) => document.id === result.entry.document.id,
      );

      if (existingIndex === -1) {
        return [...current, result.entry];
      }

      return current.map((entry, index) =>
        index === existingIndex ? result.entry : entry,
      );
    });

    return result.entry.document.id;
  }, []);

  return (
    <BrowserRouter>
      <ViewerRoutes documents={documents} fileError={fileError} onFiles={onFiles} />
    </BrowserRouter>
  );
}
