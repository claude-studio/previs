export interface ViewerInfo {
  name: string;
  version: string;
  docsDir: string;
  pid: number;
  startedAt: number;
}

function isViewerInfo(value: unknown): value is ViewerInfo {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const info = value as Record<string, unknown>;
  return (
    typeof info.name === 'string' &&
    typeof info.version === 'string' &&
    typeof info.docsDir === 'string' &&
    typeof info.pid === 'number' &&
    Number.isInteger(info.pid) &&
    info.pid > 0 &&
    typeof info.startedAt === 'number'
  );
}

export async function fetchViewerInfo(port: number, timeoutMs = 1000): Promise<ViewerInfo | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/viewer-info`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    return isViewerInfo(payload) ? payload : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function isReusable(info: ViewerInfo | null, expectedDocsDir: string): info is ViewerInfo {
  return info?.name === 'previs-viewer' && info.docsDir === expectedDocsDir;
}
