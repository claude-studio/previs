import { describe, expect, it } from 'vitest';

import { dataModelSchema } from './data-model.js';

describe('dataModelSchema', () => {
  it('accepts entities with relations and inferred flags', () => {
    const result = dataModelSchema.safeParse({
      id: 'dm1',
      type: 'data-model',
      entities: [
        {
          name: 'documents',
          fields: [
            { name: 'id', type: 'uuid' },
            { name: 'kind', type: 'text', note: 'plan | recap', inferred: true },
          ],
        },
        { name: 'comments', fields: [{ name: 'document_id', type: 'uuid' }], inferred: true },
      ],
      relations: [{ from: 'documents', to: 'comments', kind: '1-n', label: 'has' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an entity without fields', () => {
    const result = dataModelSchema.safeParse({
      id: 'dm1',
      type: 'data-model',
      entities: [{ name: 'documents', fields: [] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown relation kind', () => {
    const result = dataModelSchema.safeParse({
      id: 'dm1',
      type: 'data-model',
      entities: [{ name: 'documents', fields: [{ name: 'id', type: 'uuid' }] }],
      relations: [{ from: 'documents', to: 'comments', kind: 'one-to-many' }],
    });
    expect(result.success).toBe(false);
  });
});
