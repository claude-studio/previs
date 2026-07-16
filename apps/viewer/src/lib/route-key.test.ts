import { describe, expect, it } from 'vitest';

import { documentRouteKey } from './route-key';

describe('documentRouteKey', () => {
  it('produces URL-safe keys for hostile ids', () => {
    for (const id of ['release-100%', 'feature%2Fviewer', 'docs/plan-1', '한국어 id', 'a+b=c']) {
      expect(documentRouteKey(id)).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it('is deterministic and collision-free for lookalike ids', () => {
    expect(documentRouteKey('docs/plan-1')).toBe(documentRouteKey('docs/plan-1'));
    expect(documentRouteKey('docs/plan-1')).not.toBe(documentRouteKey('docs%2Fplan-1'));
  });
});
