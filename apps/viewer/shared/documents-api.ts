export interface PublishedDocumentsPayload {
  documents: {
    fileName: string;
    mtimeMs: number;
    raw: unknown;
  }[];
  errors: {
    fileName: string;
    message: string;
  }[];
}
