import { describe, expect, it } from 'vitest';

import { cardIdentity } from './card-identity';

const allIdentities = [
  'magenta',
  'coral',
  'blue-purple',
  'blue',
  'rose',
  'purple',
  'coral-purple',
  'violet',
];

describe('cardIdentity', () => {
  it('is deterministic for the same document id', () => {
    expect(cardIdentity('sample-plan')).toBe(cardIdentity('sample-plan'));
    expect(cardIdentity('kitchen-sink')).toBe(cardIdentity('kitchen-sink'));
  });

  it('always returns one of the eight brand gradient identities', () => {
    for (const id of ['a', 'sample-plan', 'doc-42', '한국어-id', 'previs']) {
      expect(allIdentities).toContain(cardIdentity(id));
    }
  });

  it('assigns distinct identities to the three builtin fixtures', () => {
    const picks = new Set(
      ['sample-plan', 'sample-recap', 'kitchen-sink'].map((id) => cardIdentity(id)),
    );
    expect(picks.size).toBe(3);
  });
});
