# Code Review: 와이어프레임 렌더러 — 손그림 계층 1/2 (M3)

**Review Date**: 2026-07-16  
**Version**: 0.3.1  
**Files Reviewed**:

- `apps/viewer/package.json`
- `apps/viewer/src/components/blocks/BlockRenderer.test.tsx`
- `apps/viewer/src/components/blocks/BlockRenderer.tsx`
- `apps/viewer/src/components/blocks/FallbackBlock.tsx`
- `apps/viewer/src/test-setup.ts`
- `docs/ARCHI.md`
- `packages/schema/fixtures/kitchen-sink.json`
- `packages/schema/fixtures/sample-plan.json`
- `pnpm-lock.yaml`

**Plan**: `docs/1-plans/F_0.3.1_wireframe-renderer.plan.md`

---

## Executive Summary

DOMPurify 기반 HTML 정제, 5종 surface 프리셋, rough.js 오버레이와 라이트·다크 테마를 갖춘 와이어프레임 렌더러가 구현됐다. 반복 리뷰에서 발견된 두 가지 lazy-load 오류 처리 문제는 모두 해결됐으며, lint·typecheck와 106개 테스트가 통과했다.

APPROVED

---

## Changes Overview

`wireframe` 블록을 fallback에서 실제 lazy-loaded 렌더러로 전환하고, 시맨틱 HTML allowlist와 읽기 전용 정책을 적용했다. `--wf-*` 콘텐츠 토큰, 결정적 rough.js 오버레이, 5종 surface 크롬, 관련 픽스처와 회귀 테스트를 추가했다. 렌더러 청크 로드 실패는 블록 단위 error boundary로 격리하며, 브라우저 모듈 캐시 특성에 맞춰 페이지 새로고침 복구를 제공한다.

---

## Findings

### Critical Issues

None.

### Major Issues

#### Lazy chunk failure crashed the viewer

- **Location**: `apps/viewer/src/components/blocks/BlockRenderer.tsx:29`, `apps/viewer/src/components/blocks/BlockRenderer.tsx:61`
- **Description**: 최초 구현은 `Suspense`만 사용해 lazy import rejection이 루트까지 전파되고, 열어 둔 문서 화면 전체가 중단될 수 있었다.
- **Disposition**: **Addressed.** `WireframeErrorBoundary`가 오류를 블록 단위로 격리하고 인라인 복구 안내를 렌더링한다. 회귀 검증은 `apps/viewer/src/components/blocks/BlockRenderer.error.test.tsx:20`에 추가됐다.

#### Same-specifier dynamic import retry could not recover

- **Location**: `apps/viewer/src/components/blocks/BlockRenderer.tsx:13`, `apps/viewer/src/components/blocks/BlockRenderer.tsx:27`, `apps/viewer/src/components/blocks/BlockRenderer.tsx:45`
- **Description**: 중간 수정은 새 `React.lazy` 인스턴스를 만들어 재시도했지만, 브라우저가 실패한 동일 module specifier를 캐시하므로 실제 복구가 불가능했다.
- **Disposition**: **Addressed.** 인플레이스 재시도 상태를 제거하고 단일 lazy 인스턴스로 단순화했다. 실패 메시지는 새로고침을 명시하며, 복구 버튼은 `window.location.reload()`를 호출한다.

### Minor Issues

None.

### Suggestions

None.

---

## Checklist

- [x] 1. Functional Requirements — passed
- [x] 2. Code Quality — passed
- [x] 3. Architectural Compliance — passed
- [x] 4. 블록 콘텐츠 무결성 — passed
- [x] 5. 시각 계층 준수 — passed
- [x] 6. Supabase 데이터 안전 — not applicable; no Supabase changes
- [x] 7. Error Handling — passed
- [x] 8. Security — passed
- [x] 9. Performance — passed

---

## Verdict

**APPROVED**

두 Major finding은 모두 최종 변경에서 해결됐으며 open finding이나 override는 없다. lint와 typecheck가 clean이고 106개 테스트가 통과했다. 대응 changelog는 저장소 워크플로에 따라 TRIP-3 릴리스 단계로 이관됐다.

