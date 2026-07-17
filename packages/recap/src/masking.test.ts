import { describe, expect, it } from 'vitest';

import { isEnvPath, maskDiff } from './masking.js';

describe('maskDiff', () => {
  it('masks sk- token keeping prefix', () => {
    expect(maskDiff('+const key = "sk-abcdef1234567890"')).toContain('sk-•••');
    expect(maskDiff('+const key = "sk-abcdef1234567890"')).not.toContain('abcdef');
  });

  it('masks github and slack tokens', () => {
    expect(maskDiff('ghp_0123456789abcdef0123')).toContain('ghp_•••');
    expect(maskDiff('xoxb-1234567890-abcdef')).toContain('xox');
  });

  it('masks JWT-like triple-segment tokens', () => {
    const jwt = 'eyJhbGciOi.eyJzdWIiOi.SflKxwRJSM';
    expect(maskDiff(`Authorization: Bearer ${jwt}`)).not.toContain('SflKxwRJSM');
  });

  it('redacts PEM private key blocks', () => {
    const pem = '-----BEGIN RSA PRIVATE KEY-----\nMIIabc\n-----END RSA PRIVATE KEY-----';
    expect(maskDiff(pem)).toBe('<redacted>');
  });

  it('masks secret-named assignment right-hand side', () => {
    expect(maskDiff('+  password = "hunter2"')).toContain('<redacted>');
    expect(maskDiff('+  password = "hunter2"')).not.toContain('hunter2');
  });

  it('masks quoted JSON key form', () => {
    const masked = maskDiff('+  "password": "hunter2"');
    expect(masked).toContain('<redacted>');
    expect(masked).not.toContain('hunter2');
  });

  it('masks quoted values containing spaces fully', () => {
    const masked = maskDiff('+  secret = "my long secret value"');
    expect(masked).not.toContain('long secret value');
    expect(masked).toContain('<redacted>');
  });

  it('masks token with underscore-separated key name', () => {
    const masked = maskDiff('+  access_key: AKIAIOSFODNN7EXAMPLE');
    expect(masked).not.toContain('AKIAIOSFODNN7EXAMPLE');
  });

  it('masks all env assignments in .env files', () => {
    const diff = '+DATABASE_URL=postgres://user:pw@host\n+PORT=5432';
    const masked = maskDiff(diff, '.env');
    expect(masked).not.toContain('postgres://user:pw@host');
    expect(masked).not.toContain('5432');
  });

  it('leaves diff headers intact in env files', () => {
    const diff = '+++ b/.env\n@@ -1 +1 @@\n+KEY=value';
    const masked = maskDiff(diff, '.env');
    expect(masked).toContain('+++ b/.env');
    expect(masked).toContain('@@ -1 +1 @@');
    expect(masked).not.toContain('=value');
  });

  it('does not mask ordinary code', () => {
    const diff = '+function add(a, b) {\n+  return a + b;\n+}';
    expect(maskDiff(diff, 'src/math.ts')).toBe(diff);
  });
});

describe('isEnvPath', () => {
  it('matches .env variants', () => {
    expect(isEnvPath('.env')).toBe(true);
    expect(isEnvPath('config/.env.local')).toBe(true);
    expect(isEnvPath('app/production.env')).toBe(true);
  });

  it('rejects non-env files', () => {
    expect(isEnvPath('src/environment.ts')).toBe(false);
  });
});
