# Code Review: 뷰어 MVP — 읽기 전용 렌더링 (M2)

**Review Date**: 2026-07-16  
**Version**: 0.3.0  
**Files Reviewed**:

- `docs/4-unit-tests/TESTING.md`
- `docs/ARCHI.md`
- `package.json`
- `packages/schema/package.json`
- `pnpm-lock.yaml`
- `vitest.config.ts`

**Plan**: `docs/1-plans/F_0.3.0_viewer-mvp.plan.md`

---

## Executive Summary

로컬 JSON 문서를 검증·렌더링하는 React 뷰어와 기본 블록 렌더러 6종, 파일 열기, 테마 전환, 안전한 문서 라우팅을 구현했다. 세 차례 리뷰에서 확인된 Major 2건과 Minor 4건은 모두 수정됐으며, lint·typecheck와 테스트 76건이 통과했다.

APPROVED

---

## Changes Overview

`apps/viewer`에 Vite·React 기반 SPA와 문서 목록·문서 뷰·파일 로딩 흐름을 추가하고, `@previs/schema` 픽스처와 런타임 검증을 연결했다. prose, callout, file-tree, tabs, columns, diff 렌더러와 미구현 블록 fallback을 제공하며, Shiki는 지연 초기화되는 싱글턴으로 사용한다. 루트 Vitest 프로젝트와 테스트 문서, 아키텍처 문서, 스키마 fixture export도 뷰어 구성에 맞게 갱신했다.

---

## Findings

### Critical Issues

None.

### Major Issues

- **퍼센트 문자가 포함된 문서 ID의 이중 디코딩**
  - **Location**: `apps/viewer/src/lib/route-key.ts:3`, `apps/viewer/src/App.tsx:34`, `apps/viewer/src/components/app/DocumentView.tsx:22`, `apps/viewer/src/App.test.tsx:76`
  - React Router가 이미 처리한 경로 매개변수를 다시 디코딩해 `release-100%` 같은 스키마상 유효한 ID가 `URIError`를 발생시키거나 잘못 조회될 수 있었다. 최종 구현은 문서 ID를 base64url 불투명 키로 변환하고 키끼리 비교하므로 별도 디코딩 경로가 없다.
  - **Disposition**: addressed.

- **리터럴 `%2F` ID와 실제 슬래시 ID의 라우트 충돌**
  - **Location**: `apps/viewer/src/lib/route-key.ts:3`, `apps/viewer/src/lib/route-key.test.ts:12`, `apps/viewer/src/components/app/DocumentCard.tsx:37`, `apps/viewer/src/components/app/DocumentView.tsx:23`, `apps/viewer/src/App.test.tsx:88`, `apps/viewer/src/App.test.tsx:100`
  - 첫 수정 후에도 `feature%2Fviewer`와 `feature/viewer`가 React Router 내부에서 같은 값으로 정규화될 수 있었다. 링크 생성, 파일 열기 후 이동, 문서 조회가 모두 동일한 base64url 키를 사용하도록 통일해 충돌을 제거했다.
  - **Disposition**: addressed.

### Minor Issues

- **파일 트리의 `note`가 네이티브 tooltip에만 노출됨**
  - **Location**: `apps/viewer/src/components/blocks/FileTreeBlock.tsx:70`
  - 터치·키보드 환경에서 확인하기 어려웠던 메모를 파일명 옆 인라인 텍스트로 렌더링하도록 변경했다.
  - **Disposition**: addressed.

- **diff 추가·삭제 행의 전폭 배경 누락**
  - **Location**: `apps/viewer/src/components/blocks/DiffBlock.tsx:39`, `apps/viewer/src/components/blocks/DiffBlock.tsx:73`, `apps/viewer/src/index.css:147`
  - Shiki 문법 색상만 적용되고 행 배경은 없었다. transformer가 `line-add`·`line-remove` 클래스를 부여하고 success·danger 시맨틱 토큰 기반 배경을 적용하도록 수정했다.
  - **Disposition**: addressed.

- **블록 콘텐츠에 앱 브랜드 토큰 혼입**
  - **Location**: `apps/viewer/src/components/blocks/ProseBlock.tsx:43`, `apps/viewer/src/components/blocks/CalloutBlock.tsx:15`, `apps/viewer/src/components/blocks/FileTreeBlock.tsx:42`, `apps/viewer/src/index.css:30`
  - prose 링크, info callout, file-tree 상태가 `brand-*` 토큰을 사용해 앱 크롬과 콘텐츠 계층의 시각 경계를 흐렸다. 콘텐츠용 `info`·`info-soft`와 기존 상태 토큰으로 교체했으며 블록 렌더러 내 브랜드 토큰은 제거했다.
  - **Disposition**: addressed.

- **diff 파일 헤더 제외 조건이 실제 `++`/`--` 코드 행까지 제외**
  - **Location**: `apps/viewer/src/components/blocks/DiffBlock.tsx:12`, `apps/viewer/src/components/blocks/DiffBlock.test.ts:14`, `apps/viewer/src/components/blocks/DiffBlock.test.ts:33`
  - `+++`·`---` 접두사만으로 파일 헤더를 판별해 `++counter;` 같은 실제 추가 코드가 배경 분류에서 빠졌다. 순수 함수 `classifyDiffLines`로 추출해 헌크 내부만 분류하고, 헌크가 없는 발췌는 전체 행을 분류하도록 수정했다.
  - **Disposition**: addressed.

### Suggestions

None.

---

## Checklist

- [x] 1. Functional Requirements — passed
- [x] 2. Code Quality — passed
- [x] 3. Architectural Compliance — passed
- [x] 4. 블록 콘텐츠 무결성 — passed; 생성 단계의 Grounding·Budget 검사는 적용 대상이 아니며 모든 입력은 스키마 검증을 통과한다
- [x] 5. 시각 계층 준수 — passed
- [x] 6. Supabase 데이터 안전 — not applicable; Supabase 변경 없음
- [x] 7. Error Handling — passed
- [x] 8. Security — passed
- [x] 9. Performance — passed

---

## Verdict

**APPROVED**

모든 발견 사항은 override나 미해결 항목 없이 수정됐다. 최종 검증 결과는 lint clean, typecheck clean, 테스트 76건 통과이며, 새 라우트 키와 diff 분류 로직에는 직접 회귀 테스트가 추가됐다.

