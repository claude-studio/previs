const REDACTED = '<redacted>';

/**
 * 알려진 토큰 접두는 접두만 남기고 마스킹한다 (예: sk-abc123 → sk-•••).
 * 접두 목록은 보수적으로 유지하되 과탐지를 허용한다.
 */
const TOKEN_PREFIXES = [
  /\bsk-[A-Za-z0-9_-]{8,}/g,
  /\b(?:ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{16,}/g,
  /\bxox[abps]-[A-Za-z0-9-]{10,}/g,
  /\bAKIA[A-Z0-9]{12,}/g,
  /\bya29\.[A-Za-z0-9._-]{10,}/g,
  /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/g,
];

const SECRET_KEY = String.raw`(?:api[_-]?key|secret|token|password|passwd|pwd|access[_-]?key)`;

/**
 * `KEY = value` / `"KEY": value` / `KEY: value` 에서 이름이 시크릿 계열이면
 * 우변을 통째로 마스킹한다. 따옴표로 감싼 값은 따옴표 내부 전체를(공백 포함),
 * 비따옴표 값은 공백 전까지를 마스킹한다.
 */
const SECRET_QUOTED = new RegExp(
  String.raw`(["']?${SECRET_KEY}["']?\s*[=:]\s*)(["'])(?:\\.|(?!\2).)*\2`,
  'gi',
);
const SECRET_BARE = new RegExp(
  String.raw`(["']?${SECRET_KEY}["']?\s*[=:]\s*)([^\s'"]+)`,
  'gi',
);

const PEM_BLOCK = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g;

/** `.env` 계열 파일의 diff 라인은 모든 `KEY=value` 우변을 마스킹. */
const ENV_ASSIGNMENT = /^([+-]?\s*[A-Za-z_][A-Za-z0-9_]*\s*=\s*)(.+)$/;

function maskPrefix(match: string): string {
  const dashIndex = match.search(/[-_.]/);
  const head = dashIndex >= 0 ? match.slice(0, dashIndex + 1) : match.slice(0, 2);
  return `${head}•••`;
}

export function isEnvPath(path: string): boolean {
  const base = path.split('/').pop() ?? path;
  return base === '.env' || base.startsWith('.env.') || base.endsWith('.env');
}

/** diff 텍스트 한 덩어리에 모든 마스킹 규칙을 적용한다. */
export function maskDiff(diff: string, path?: string): string {
  let masked = diff.replace(PEM_BLOCK, REDACTED);

  for (const pattern of TOKEN_PREFIXES) {
    masked = masked.replace(pattern, maskPrefix);
  }

  masked = masked.replace(SECRET_QUOTED, (_all, head: string) => `${head}${REDACTED}`);
  masked = masked.replace(SECRET_BARE, (_all, head: string) => `${head}${REDACTED}`);

  if (path && isEnvPath(path)) {
    masked = masked
      .split('\n')
      .map((line) => {
        if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) return line;
        return line.replace(ENV_ASSIGNMENT, (_all, head: string) => `${head}${REDACTED}`);
      })
      .join('\n');
  }

  return masked;
}
