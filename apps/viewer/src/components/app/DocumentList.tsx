import { useState, type DragEvent } from 'react';
import { IconFiles, IconUpload } from '@tabler/icons-react';

import type { DocumentEntry } from '../../lib/documents';
import { OpenFileButton } from './OpenFileButton';
import { ThemeToggle } from './ThemeToggle';
import { DocumentCard } from './DocumentCard';

export function DocumentList({
  documents,
  fileError,
  onFiles,
}: {
  documents: DocumentEntry[];
  fileError: string | null;
  onFiles: (files: File[]) => void | Promise<unknown>;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void onFiles([...event.dataTransfer.files]);
  };

  return (
    <main
      className="min-h-screen bg-canvas text-ink transition-colors"
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) {
          setIsDragging(false);
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              previs / workspace
            </p>
            <h1 className="text-heading-lg font-semibold tracking-tight text-ink">
              문서 목록
            </h1>
            <p className="mt-3 max-w-xl text-base text-steel">
              에이전트가 만든 계획과 회고를 한 곳에서 검토하세요.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OpenFileButton onFiles={onFiles} />
            <ThemeToggle />
          </div>
        </header>

        <section
          className={`rounded-hero border border-dashed p-5 transition-colors sm:p-7 ${isDragging ? 'border-primary bg-surface' : 'border-hairline bg-surface/50'}`}
        >
          <div className="mb-5 flex items-center gap-3 text-sm text-steel">
            {isDragging ? (
              <IconUpload aria-hidden="true" className="text-primary" size={20} />
            ) : (
              <IconFiles aria-hidden="true" className="text-muted" size={20} />
            )}
            <span>
              {isDragging
                ? 'JSON 문서를 여기에 놓으세요.'
                : '내장 픽스처 또는 JSON 파일을 열어 검토를 시작하세요.'}
            </span>
          </div>
          {fileError ? (
            <div
              className="mb-5 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
              role="alert"
            >
              <span className="font-semibold">문서를 열지 못했습니다.</span>{' '}
              {fileError}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {documents.map((entry) => (
              <DocumentCard entry={entry} key={entry.document.id} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
