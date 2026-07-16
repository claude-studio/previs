import { useRef, type ChangeEvent } from 'react';
import { IconFolderOpen } from '@tabler/icons-react';

import { Button } from '../ui/button';

export function OpenFileButton({
  onFiles,
}: {
  onFiles: (files: File[]) => void | Promise<unknown>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? [...event.target.files] : [];
    void onFiles(files);
    event.target.value = '';
  };

  return (
    <>
      <input
        accept=".json,application/json"
        className="sr-only"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
      <Button onClick={() => inputRef.current?.click()} variant="secondary">
        <IconFolderOpen aria-hidden="true" size={17} />
        파일 열기
      </Button>
    </>
  );
}
