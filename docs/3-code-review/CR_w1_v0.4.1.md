# Code Review: 로컬 발행 파이프라인·/previs-plan — 에이전트 스킬 1/2 (M4)

**Review Date**: 2026-07-16  
**Version**: 0.4.1  
**Files Reviewed**:

- AGENTS.md
- apps/viewer/server/previs-docs-plugin.ts
- apps/viewer/server/previs-docs-plugin.test.ts
- apps/viewer/shared/documents-api.ts
- apps/viewer/src/App.tsx
- apps/viewer/src/App.test.tsx
- apps/viewer/src/components/app/DocumentList.tsx
- apps/viewer/src/components/app/DocumentView.tsx
- apps/viewer/src/lib/documents.ts
- apps/viewer/src/lib/documents.test.ts
- apps/viewer/vite.config.ts
- packages/schema/src/cli/validate.ts
- packages/schema/src/cli/validate.test.ts
- package.json
- skills/previs-plan/SKILL.md
- .claude/skills/previs-plan (심링크)
- docs/ARCHI.md
- docs/GOAL.md

**Plan**: docs/1-plans/F_0.4.1_local-publish-plan-skill.plan.md

---

## Executive Summary

The change adds the local publishing pipeline (`.previs/` → `/api/documents`
Vite plugin → published-origin merge in the viewer), the `doc:validate` CLI,
and the `/previs-plan` skill. The Codex review converged on the first round
with no findings.

**APPROVED** (Codex loop, 1 round)

---

## Review (verbatim)

No findings.

1. Functional requirements: API, client validation, origin precedence, focus
   refresh, stale-state preservation, CLI validation, and skill workflow match
   the plan.
2. Code quality: TypeScript is properly typed and appropriately separated.
3. Architecture: Preserves the client-side trust boundary and existing
   document parsing path.
4. State machine/gate integrity: the `/previs-plan` approval gate remains
   explicit.
5. Sandbox/security: Not applicable to this change.
6. Error handling: Missing directories, malformed files, transport/HTTP
   failures, and schema failures degrade gracefully with user feedback.
7. General security: JSON and payloads are validated before rendering; no
   shell interpolation, path parameter, or secret exposure was introduced.
8. Performance: Focus-triggered reads are bounded by an in-flight guard; no
   polling, leaks, or problematic hot-path work.

Plan conformance is complete across the server API, shared types, viewer
state, CLI, skill, symlink, and documentation. The supplied gates are clean:
lint, typecheck, 130 tests including 15 new tests, live API integration, and
validator E2E.

(리뷰 시점에는 체인지로그가 아직 없었다 — 체인지로그는 릴리스 단계 산출물로,
`docs/2-changelog/w1_v0.4.1.md`에서 보완됐다.)

---

## Verification

- `pnpm lint` clean · `pnpm typecheck` clean
- 테스트 130건 통과 (신규 15건: fetch 판별 유니언 4 · App 병합/유지/회복 3 ·
  서버 플러그인 4 · 검증 CLI 4)
- 실서버 통합: 빈 디렉토리 → 발행 → `/api/documents` 서빙 → `pnpm
  doc:validate` E2E 확인 (포트 47749, previs 전용 대역)
