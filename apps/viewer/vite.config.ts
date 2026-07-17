import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { previsDocsPlugin } from './server/previs-docs-plugin';
import { previsRuntimePlugin } from './server/previs-runtime-plugin';
import viewerPackage from './package.json';
import { resolveTarget } from '../../packages/launcher/src/paths';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const target = resolveTarget(process.env, projectRoot);
const configuredPort = process.env.PREVIS_PORT?.trim();
const port = configuredPort ? Number(configuredPort) : target.candidatePort;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`PREVIS_PORT가 올바른 포트가 아닙니다: ${configuredPort}`);
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    previsRuntimePlugin({
      docsDir: target.docsDir,
      version: viewerPackage.version,
      lockPath: process.env.PREVIS_LOCK_PATH,
    }),
    previsDocsPlugin(projectRoot),
  ],
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
    port,
    strictPort: Boolean(configuredPort),
  },
});
