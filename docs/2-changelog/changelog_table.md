# Changelog Table

> Week 1 = 2026-07-13(월)이 속한 주. 주차는 이 기준일로부터의 경과 주 수 + 1이다.

| Version | Week | Commit Message                                    |
| ------- | ---- | ------------------------------------------------- |
| `0.3.0` | 1    | feat(viewer): 뷰어 MVP — 읽기 전용 렌더링 (M2)    |
| `0.2.0` | 1    | feat(schema): 블록 스키마·모노레포 스캐폴딩 (M1)  |
| `0.1.0` | 1    | chore: TRIP 워크플로우 초기화                     |

# Changelog Summary

- **v0.3.0 (M2: Viewer MVP - Week 1, 16-07-2026)**:
  - **Viewer**: `apps/viewer` React SPA — DESIGN.md 토큰 매핑(라이트/다크), 문서 목록(그라디언트 카드)·문서 뷰
  - **Renderers**: 기본 블록 6종(prose/callout/file-tree/tabs/columns/diff+shiki) + M3 fallback
  - **Loading**: 내장 픽스처 + 파일 열기/드래그앤드롭 (safeParse 게이트), base64url 라우트 키
  - **Tests**: 뷰어 29건 추가 (총 76건), 라이트/다크 Playwright 수동 검증

- **v0.2.0 (M1: Block Schema & Monorepo - Week 1, 16-07-2026)**:
  - **Monorepo**: pnpm workspace + TypeScript·ESLint·Prettier·Vitest 툴체인 확정 (`pnpm lint/typecheck/test/build`)
  - **Schema**: `@previs/schema` — 12종 블록 zod 스키마, 문서 envelope, id 유일성·중첩 깊이 검증, parse/safeParse API
  - **Fixtures & Tests**: plan/recap/kitchen-sink 픽스처, 테스트 47건 (dist ESM smoke 포함)
  - **Docs**: ARCHI.md §3·§4·§6·§14, TESTING.md 확정 전환

- **v0.1.0 (TRIP Initialization - Week 1, 16-07-2026)**:
  - **Setup**: TRIP 워크플로우 초기화, docs 구조 생성
  - **Documentation**: Full-Stack Web(React SPA + Supabase) 아키텍처 기준 ARCHI.md 생성 (사전 구현 단계)
  - **Files Added**: docs/ARCHI.md, docs/ARCHI-rules.md, docs/2-changelog/changelog_table.md, docs/4-unit-tests/TESTING.md
