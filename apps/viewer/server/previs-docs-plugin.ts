import { readdir, readFile, stat } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';

import type { Plugin } from 'vite';

import type { PublishedDocumentsPayload } from '../shared/documents-api';

const DOCUMENTS_API_PATH = '/api/documents';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sendJson(response: ServerResponse, status: number, payload: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

async function readDocuments(documentsDirectory: string): Promise<PublishedDocumentsPayload> {
  let entries;

  try {
    entries = await readdir(documentsDirectory, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { documents: [], errors: [] };
    }

    throw error;
  }

  const documents: PublishedDocumentsPayload['documents'] = [];
  const errors: PublishedDocumentsPayload['errors'] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue;
    }

    const filePath = path.join(documentsDirectory, entry.name);

    try {
      const [contents, fileStats] = await Promise.all([readFile(filePath, 'utf8'), stat(filePath)]);

      documents.push({
        fileName: entry.name,
        mtimeMs: fileStats.mtimeMs,
        raw: JSON.parse(contents) as unknown,
      });
    } catch (error) {
      errors.push({
        fileName: entry.name,
        message: errorMessage(error),
      });
    }
  }

  documents.sort((left, right) => left.fileName.localeCompare(right.fileName));
  errors.sort((left, right) => left.fileName.localeCompare(right.fileName));

  return { documents, errors };
}

export function previsDocsPlugin(projectRoot: string): Plugin {
  const configuredDirectory = process.env.PREVIS_DOCS_DIR?.trim();
  const documentsDirectory = configuredDirectory
    ? path.resolve(configuredDirectory)
    : path.resolve(projectRoot, '.previs');

  return {
    name: 'previs-documents-api',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestPath = new URL(request.url ?? '/', 'http://previs.local').pathname;

        if (requestPath !== DOCUMENTS_API_PATH || request.method !== 'GET') {
          next();
          return;
        }

        void readDocuments(documentsDirectory)
          .then((payload) => sendJson(response, 200, payload))
          .catch((error: unknown) => {
            sendJson(response, 500, { message: errorMessage(error) });
          });
      });
    },
  };
}
