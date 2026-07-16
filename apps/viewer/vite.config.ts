import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { previsDocsPlugin } from './server/previs-docs-plugin';

const PORT_START = 47738;
const PORT_COUNT = 64;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function hashPath(value: string): number {
  let hash = 5381;

  for (const character of value) {
    hash = (hash * 33) ^ character.charCodeAt(0);
  }

  return hash >>> 0;
}

function viewerPort(): number {
  return PORT_START + (hashPath(projectRoot) % PORT_COUNT);
}

export default defineConfig({
  plugins: [react(), tailwindcss(), previsDocsPlugin(projectRoot)],
  resolve: {
    alias: [
      {
        find: /^@previs\/schema$/,
        replacement: path.resolve(projectRoot, 'packages/schema/src/index.ts'),
      },
    ],
  },
  server: {
    host: '127.0.0.1',
    port: viewerPort(),
    strictPort: false,
  },
});
