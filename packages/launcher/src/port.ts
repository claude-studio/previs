import { createServer } from 'node:net';

import { fetchViewerInfo, isReusable, type ViewerInfo } from './health.js';
import { PORT_END, PORT_START } from './paths.js';

export type PortResolution =
  | { kind: 'free'; port: number }
  | { kind: 'adopt'; port: number; info: ViewerInfo };

function canBind(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    let settled = false;

    const finish = (available: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(available);
    };

    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        finish(false);
        return;
      }

      reject(error);
    });
    server.listen({ host: '127.0.0.1', port }, () => {
      server.close((error) => finish(!error));
    });
  });
}

export async function resolveBandPort(startPort: number, docsDir: string): Promise<PortResolution> {
  if (startPort < PORT_START || startPort > PORT_END) {
    throw new Error(`포트 후보가 전용 대역을 벗어났습니다: ${startPort}`);
  }

  for (let port = startPort; port <= PORT_END; port += 1) {
    if (await canBind(port)) {
      return { kind: 'free', port };
    }

    const info = await fetchViewerInfo(port, 500);
    if (isReusable(info, docsDir)) {
      return { kind: 'adopt', port, info };
    }
  }

  throw new Error(`previs 전용 포트 대역(${PORT_START}~${PORT_END})이 모두 사용 중입니다.`);
}
