# Code Review: 블록 스키마 & 모노레포 스캐폴딩 (M1)

**Review Date**: 2026-07-16  
**Version**: 0.2.0  
**Files Reviewed**:

- `docs/4-unit-tests/TESTING.md`
- `docs/ARCHI.md`

**Plan**: `docs/1-plans/F_0.2.0_block-schema-monorepo.plan.md`

---

## Executive Summary

pnpm 모노레포 툴체인과 12종 JSON 블록 스키마, 문서 단위 검증, 샘플 픽스처를 구현했다. 초기 리뷰의 Major finding 2건은 모두 수정됐으며 lint, typecheck, 신규 테스트 47건이 통과했다.

APPROVED

---

## Changes Overview

`@previs/schema` 패키지에 Zod 기반 블록·문서 스키마와 parse API를 추가하고, 블록 ID 유일성 및 컨테이너 중첩 깊이를 검증한다. pnpm, TypeScript, ESLint, Prettier, Vitest 공통 툴체인을 구성했으며 plan·recap·kitchen-sink 픽스처를 제공한다. 아키텍처와 테스트 문서도 구현 상태에 맞게 갱신했다.

---

## Findings

### Critical Issues

None.

### Major Issues

1. **Node 지원 범위가 의존성의 지원 범위보다 넓음** — [`package.json:8`](/Users/genie/Desktop/jb/previs/package.json:8).  
   ESLint가 지원하지 않는 Node 22.0–22.12 및 23도 지원 대상으로 선언되어 있었다. `^22.13.0 || >=24`로 수정하고 [`ARCHI.md:90`](/Users/genie/Desktop/jb/previs/docs/ARCHI.md:90)과 [`plan:70`](/Users/genie/Desktop/jb/previs/docs/1-plans/F_0.2.0_block-schema-monorepo.plan.md:70)을 정합화했다. 이는 [`pnpm-lock.yaml:451`](/Users/genie/Desktop/jb/previs/pnpm-lock.yaml:451)의 ESLint 요구 범위와 일치한다.  
   **Disposition: addressed.**

2. **픽스처의 diff 블록이 실제 소스에 근거하지 않음** — [`sample-recap.json:95`](/Users/genie/Desktop/jb/previs/packages/schema/fixtures/sample-recap.json:95), [`kitchen-sink.json:58`](/Users/genie/Desktop/jb/previs/packages/schema/fixtures/kitchen-sink.json:58), [`kitchen-sink.json:94`](/Users/genie/Desktop/jb/previs/packages/schema/fixtures/kitchen-sink.json:94).  
   존재하지 않는 변수와 축약된 타입 선언을 실제 변경처럼 표시해 Grounding Rule을 위반했다. 각 발췌를 [`block.ts:16`](/Users/genie/Desktop/jb/previs/packages/schema/src/block.ts:16), [`block.ts:23`](/Users/genie/Desktop/jb/previs/packages/schema/src/block.ts:23), [`block.ts:37`](/Users/genie/Desktop/jb/previs/packages/schema/src/block.ts:37)의 실제 소스 라인으로 교체했다. 연관된 annotated-code도 [`kitchen-sink.json:101`](/Users/genie/Desktop/jb/previs/packages/schema/fixtures/kitchen-sink.json:101)에서 실제 [`index.ts:48`](/Users/genie/Desktop/jb/previs/packages/schema/src/index.ts:48) 발췌로 정정했다.  
   **Disposition: addressed.**

### Minor Issues

None.

### Suggestions

None.

---

## Checklist

- [x] 1. Functional Requirements — passed
- [x] 2. Code Quality — passed
- [x] 3. Architectural Compliance — passed
- [x] 4. 블록 콘텐츠 무결성 — passed after grounding corrections
- [x] 5. 시각 계층 준수 — not applicable; no viewer UI changes
- [x] 6. Supabase 데이터 안전 — not applicable; no database changes
- [x] 7. Error Handling — passed
- [x] 8. Security — passed
- [x] 9. Performance — passed

---

## Verdict

**APPROVED**

초기 Major finding 2건은 모두 해결됐으며 override나 미해결 finding은 없다. 요청자가 제공한 최종 게이트 결과는 lint clean, typecheck clean, tests 47 passed이며 신규 로직에 대응하는 테스트가 포함됐다.

