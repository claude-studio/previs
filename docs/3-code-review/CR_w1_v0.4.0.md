# Code Review: 잔여 블록 렌더러 — 손그림 계층 2/2 (M3 완료)

**Review Date**: 2026-07-16  
**Version**: 0.4.0  
**Files Reviewed**:

- apps/viewer/package.json
- apps/viewer/src/App.test.tsx
- apps/viewer/src/components/blocks/BlockRenderer.test.tsx
- apps/viewer/src/components/blocks/BlockRenderer.tsx
- apps/viewer/src/components/blocks/DiffBlock.tsx
- apps/viewer/src/components/blocks/FallbackBlock.tsx
- apps/viewer/src/components/blocks/wireframe/wireframe.css
- apps/viewer/src/index.css
- docs/ARCHI.md
- docs/GOAL.md
- packages/schema/fixtures/sample-plan.json
- packages/schema/fixtures/sample-recap.json
- pnpm-lock.yaml

**Plan**: docs/1-plans/F_0.4.0_remaining-block-renderers.plan.md

---

## Executive Summary

The change completes the remaining diagram, annotated-code, data-model, API-endpoint, and question-form renderers for M3. Across the review rounds, three actionable findings were raised—one Critical, one Major, and one Minor—and all were addressed with regression coverage and corresponding plan or fixture updates.

**APPROVED**

---

## Changes Overview

The implementation adds the remaining block renderers, shared Shiki highlighting, Mermaid rendering with hand-drawn themes, renderer dispatch, graceful fallbacks, and updated fixtures and architecture documentation. Mermaid diagrams now undergo conservative pre-render resource rejection and post-render SVG sanitization. Final verification reports lint and type-check clean, 162 passing tests, and successful light/dark kitchen-sink rendering without console errors.

---

## Findings

### Critical Issues

1. **Mermaid external-resource preflight could be bypassed by YAML syntax variants** — `apps/viewer/src/components/blocks/diagram-mermaid.ts:170`

   **Disposition: Addressed.** The original quoted-key and protocol-relative URL bypass was covered at `apps/viewer/src/components/blocks/diagram-mermaid.test.ts:184`. Subsequent YAML escape and anchor/alias variants were covered at `apps/viewer/src/components/blocks/diagram-mermaid.test.ts:197` and `apps/viewer/src/components/blocks/diagram-mermaid.test.ts:210`. The final implementation closes the parser mismatch by rejecting all `@{…}` shape metadata before Mermaid runs at `apps/viewer/src/components/blocks/diagram-mermaid.ts:175`. This conservative policy and its intentional false-positive tradeoff are documented at `docs/1-plans/F_0.4.0_remaining-block-renderers.plan.md:104`; a future parsed-key allowlist is explicitly deferred.

### Major Issues

1. **Unknown Shiki languages could lose annotated-code structure because `loadLanguage` throws synchronously** — `apps/viewer/src/lib/highlighter.ts:52`

   **Disposition: Addressed.** Language loading is wrapped in `Promise.resolve().then(...)`, allowing synchronous Shiki failures to enter the fallback path at `apps/viewer/src/lib/highlighter.ts:53`. The synchronous-throw regression and plain-text fallback are exercised at `apps/viewer/src/lib/highlighter.test.ts:10` and `apps/viewer/src/lib/highlighter.test.ts:46`.

### Minor Issues

1. **The sample recap used an incorrect `startLine` and an ungrounded excerpt** — `packages/schema/fixtures/sample-recap.json:102`

   **Disposition: Addressed.** The fixture now contains the actual three-line source excerpt and uses `startLine: 48` at `packages/schema/fixtures/sample-recap.json:102` and `packages/schema/fixtures/sample-recap.json:103`, matching `parsePrevisDocument` at `packages/schema/src/index.ts:48`.

### Suggestions

None. No findings were overridden or remain open.

---

## Checklist

- [x] 1. Functional Requirements — All planned renderer mappings, behavior, fallbacks, fixtures, and documentation updates are present.
- [x] 2. Code Quality — Shared highlighting and renderer utilities have clear ownership and avoid unnecessary duplication.
- [x] 3. Architectural Compliance — The implementation follows the JSON block-renderer architecture and keeps runtime rendering isolated in the viewer.
- [x] 4. 블록 콘텐츠 무결성 — Structured fixtures are grounded in actual source, and secret/resource safety constraints are preserved.
- [x] 5. 시각 계층 준수 — The new renderers use the established theme-token and hand-drawn visual hierarchy across light and dark modes.
- [x] 6. Supabase 데이터 안전 — Not applicable; the change contains no Supabase schema, RLS, storage, or migration changes.
- [x] 7. Error Handling — Unknown languages, rendering failures, stale renders, and unsupported blocks degrade gracefully.
- [x] 8. Security — Mermaid input is conservatively rejected before rendering when shape metadata or external-resource patterns are present, and generated SVG is sanitized afterward.
- [x] 9. Performance — Mermaid is loaded lazily, rendering is serialized where required, and stale render cleanup prevents obsolete output from replacing current state.

---

## Verdict

**APPROVED**

All review findings are resolved. The final conservative rejection of Mermaid `@{…}` metadata is an intentional, plan-documented security policy; relaxing it through a parsed allowlist is deferred to a later additive change. Reported gates are clean: lint, type-check, and 162 tests passed, with successful manual light/dark and hand-drawn-theme verification.

