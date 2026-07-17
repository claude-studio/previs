# Changelog Table

> Week 1 = 2026-07-13(월)이 속한 주. 주차는 이 기준일로부터의 경과 주 수 + 1이다.

| Version | Week | Commit Message                                          |
| ------- | ---- | ------------------------------------------------------- |
| `0.5.0` | 1    | feat(recap): /previs-recap — diff 기계 도출 파이프라인 (M4 2/2 완료) |
| `0.4.1` | 1    | feat(skills): 로컬 발행 파이프라인·/previs-plan — 에이전트 스킬 1/2 (M4) |
| `0.4.0` | 1    | feat(viewer): 잔여 블록 렌더러 — 손그림 계층 2/2 (M3 완료) |
| `0.3.1` | 1    | feat(viewer): 와이어프레임 렌더러 — 손그림 계층 1/2 (M3) |
| `0.3.0` | 1    | feat(viewer): 뷰어 MVP — 읽기 전용 렌더링 (M2)    |
| `0.2.0` | 1    | feat(schema): 블록 스키마·모노레포 스캐폴딩 (M1)  |
| `0.1.0` | 1    | chore: TRIP 워크플로우 초기화                     |

# Changelog Summary

- **v0.5.0 (M4 2/2: /previs-recap — diff 기계 도출 파이프라인 - Week 1, 17-07-2026)**:
  - **@previs/recap CLI**: git diff → file-tree·diff 블록 기계 도출(Grounding·Budget·마스킹을 코드로 강제), 서사·와이어프레임만 스킬이 작성하는 하이브리드
  - **diff 소스**: auto(논리적 브랜치 동치·더티 게이트·`merge-base..HEAD`) + `--range`/`--staged`/`--worktree`(untracked `--no-index` 합성 patch 포함)
  - **발췌·마스킹**: hunk 단위 ~148줄 budget 절단, churn 랭킹·lockfile 강등, 토큰 접두·PEM·.env·시크릿 할당(JSON 키·공백 값) 마스킹, 전체 patch는 out-of-line
  - **스키마**: `source.mode` optional enum 추가(additive), skip 판정·`errors` 발행 중단·`--out` 필수, 루트 `pnpm recap:derive`
  - **/previs-recap 스킬**: recap 표준 골격 조립·doc:validate 루프·명시 호출 전용, recap 63건 추가(총 245건), E2E `v0.3.0..v0.4.1` 도출→조립→검증

- **v0.4.1 (M4 1/2: Local Publish Pipeline & /previs-plan - Week 1, 16-07-2026)**:
  - **발행 서빙 API**: `/api/documents` Vite 플러그인 — `.previs/*.json` raw 서빙 (`PREVIS_DOCS_DIR` 오버라이드, 깨진 JSON errors 보고), 검증은 클라이언트 경계 유지
  - **published origin**: 판별 유니언 fetch(전송 실패 ≠ 빈 디렉토리), mount·focus 갱신, 실패 시 마지막 성공 목록 유지 + `publishedError`, 우선순위 `opened > published > builtin`
  - **검증 CLI**: `pnpm doc:validate <file>` — safeParse 이슈 출력·exit 코드 게이트
  - **/previs-plan 스킬**: `skills/` 제품 디렉토리 + `.claude/skills/` 심링크, plan 골격·발행 규약(`plan-YYYYMMDD-<slug>`, 충돌 접미사)·승인 게이트, 명시 호출 전용
  - **스킬 명칭 확정**: `/previs-plan`·`/previs-recap`으로 문서 일괄 갱신, 테스트 15건 추가 (총 177건)

- **v0.4.0 (M3 2/2: Remaining Block Renderers - Week 1, 16-07-2026)**:
  - **diagram**: mermaid 11 handDrawn + `--wf-*` 실값 매핑, 결정적 seed, 테마 관찰 재렌더, lazy 격리
  - **mermaid 보안 어댑터**: 직렬화 큐·세대 가드, 작성자 지시어 strip + 신뢰 frontmatter 주입, `@{…}` 메타데이터 등 외부 리소스 사전 거부 + SVG 후처리
  - **annotated-code**: shiki 공용 싱글턴(`lib/highlighter.ts`, plaintext 폴백) + 라인 마커·마진 주석
  - **구조화 카드**: data-model·api-endpoint(FieldTable 공유, inferred 배지)·question-form(읽기 전용)
  - **안정성**: lazy 경계 공용화, FallbackBlock 미지 타입 방어 축소, 테스트 56건 추가 (총 162건)

- **v0.3.1 (M3 1/2: Wireframe Renderer - Week 1, 16-07-2026)**:
  - **--wf-\* 손그림 계층**: 콘텐츠 전용 토큰(라이트/다크 자동 반전) + `.wf-root` 시맨틱 요소 스타일 + surface 프리셋 5종 크롬
  - **Sanitize**: DOMPurify 태그·속성 이중 allowlist, view-only 강제(disabled·링크/제출 무력화·외부 리소스 차단)
  - **rough.js 오버레이**: block.id 시드 결정적 스케치, CSS 변수 스트로크로 무재그리기 테마 반전
  - **안정성**: lazy 청크 실패 에러 바운더리(새로고침 복구), 테스트 30건 추가 (총 106건)

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
