import { describe, expect, it } from 'vitest';

import { apiEndpointSchema } from './api-endpoint.js';

const base = {
  id: 'api1',
  type: 'api-endpoint',
  method: 'POST',
  path: '/api/documents',
};

describe('apiEndpointSchema', () => {
  it('accepts request fields and responses', () => {
    const result = apiEndpointSchema.safeParse({
      ...base,
      summary: '문서 발행',
      request: {
        body: [{ name: 'title', type: 'string', required: true }],
        query: [{ name: 'dryRun', type: 'boolean' }],
      },
      responses: [
        { status: 201, body: [{ name: 'id', type: 'string' }] },
        { status: 422, note: '스키마 검증 실패' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown method', () => {
    const result = apiEndpointSchema.safeParse({
      ...base,
      method: 'FETCH',
      responses: [{ status: 200 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range status code', () => {
    const result = apiEndpointSchema.safeParse({ ...base, responses: [{ status: 600 }] });
    expect(result.success).toBe(false);
  });

  it('rejects empty responses', () => {
    const result = apiEndpointSchema.safeParse({ ...base, responses: [] });
    expect(result.success).toBe(false);
  });
});
