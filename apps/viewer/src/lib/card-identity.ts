export type CardIdentity =
  | 'magenta'
  | 'coral'
  | 'blue-purple'
  | 'blue'
  | 'rose'
  | 'purple'
  | 'coral-purple'
  | 'violet';

const identities: CardIdentity[] = [
  'magenta',
  'coral',
  'blue-purple',
  'blue',
  'rose',
  'purple',
  'coral-purple',
  'violet',
];

export function cardIdentity(documentId: string): CardIdentity {
  let hash = 5381;

  for (const character of documentId) {
    hash = ((hash * 33) ^ character.charCodeAt(0)) >>> 0;
  }

  return identities[hash % identities.length];
}
