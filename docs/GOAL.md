# previs GOAL & Roadmap

> 이 문서는 previs의 전체 목표와 마일스톤을 정의하는 최상위 계획이다.
> 모든 TRIP 사이클(`/TRIP-1-plan` → implement → release)은 이 문서의
> 마일스톤 단위에서 파생되며, 각 계획 문서는 `docs/1-plans/`에 남는다.
> 마일스톤 완료 시 이 문서의 상태를 갱신한다.

## 최종 목표 (GOAL)

**에이전트가 쓰고, 사람이 검토하는 비주얼 문서 도구.**

1. **속도** — 발행·확인 왕복이 없는 로컬 우선 파이프라인. 스킬 호출 →
   JSON 블록 문서 생성 → 뷰어 확인까지 수 초 이내.
2. **데이터 주권** — 계획·코드 발췌가 외부 SaaS에 저장되지 않는다.
   모든 데이터는 저장소와 자체 인프라에만 존재한다.
3. **검토 품질** — 다이어그램·와이어프레임·주석 diff로 리뷰어가 raw diff
   이전에 변경의 "형태"를 파악한다. plan은 승인 게이트, recap은 리뷰 진입점.
4. **협업** — 블록 앵커 코멘트와 에이전트 피드백 루프 (후반 마일스톤).

## 마일스톤

### M0. 작업 준비 — ✅ 완료 (v0.1.0)

규칙(AGENTS.md), 디자인 시스템(DESIGN.md), 아키텍처 기준(ARCHI.md),
TRIP 워크플로우 초기화.

### M1. 블록 스키마 & 모노레포 스캐폴딩

모든 계층(스킬·렌더러·저장)의 계약인 블록 JSON 스키마를 먼저 고정한다.

- pnpm workspace 구성, TypeScript·lint·test 툴체인 확정
- `packages/schema`: 블록 타입 정의 + 런타임 검증 (prose, callout, file-tree,
  tabs, columns, diff, annotated-code, data-model, api-endpoint, wireframe,
  diagram, question-form)
- 완료 기준: 스키마 검증 테스트 통과, `pnpm lint/typecheck/test` 동작
  (TRIP 스킬 명령 확정), ARCHI.md §3·§4 확정 전환

### M2. 뷰어 MVP — 읽기 전용 렌더링

로컬 JSON 문서를 열어 보는 최소 뷰어.

- `apps/viewer`: React SPA, DESIGN.md 토큰 매핑(Tailwind CSS 변수, 한글 폰트 폴백)
- 기본 블록 렌더러: prose, callout, file-tree, tabs, columns, diff(shiki)
- 문서 목록(그라디언트 카드 정체성) + 문서 뷰
- 완료 기준: 샘플 plan/recap JSON 문서가 라이트/다크에서 렌더링됨

### M3. 시각화 심화 — 손그림 계층

previs의 정체성인 `--wf-*` 손그림 체계 구현.

- wireframe 렌더러: 시맨틱 HTML + `--wf-*` 토큰 + surface 프리셋 + rough.js
  스케치 오버레이 + sanitize
- diagram(mermaid), annotated-code(마진 주석), data-model, api-endpoint 렌더러
- 완료 기준: 전체 블록 셋 렌더링, 와이어프레임 라이트/다크 자동 반전

### M4. 에이전트 스킬 — /plan · /recap

에이전트가 문서를 생성하는 파이프라인.

- `/plan`: 계획을 블록 문서로 생성 (승인 게이트 워크플로우)
- `/recap`: git diff에서 기계적으로 블록 도출 (Grounding Rule, Budget,
  시크릿 마스킹, Recap 표준 골격, Skip 조건)
- 로컬 발행: `.previs/` 문서 폴더 → 뷰어가 로드
- 완료 기준: 실제 diff로 recap 생성 → 뷰어 확인 E2E 시나리오 통과

### M5. 로컬 런처 — 싱글턴 서버

- 재사용 우선 기동: `/api/viewer-info` 정체 확인 → 원자적 락 → 기동
- 유휴 30분 자동 종료, 프로젝트 경로 해시 포트
- 완료 기준: 다중 세션 동시 호출에서 프로세스 1개 보장 테스트 통과

**→ M5까지 완료 시 "개인 도구"로 실사용 가능한 1차 완성.**

### M6. Supabase 협업 계층

팀 리뷰를 위한 호스티드 모드 (로컬 모드는 그대로 유지).

- documents/comments/profiles 테이블 + RLS (additive 마이그레이션)
- Auth(로그인·게스트), 공유 링크, Realtime 코멘트
- 피드백 루프: 스킬이 코멘트를 조회해 수정에 반영
- 사전 결정 필요: Supabase cloud vs 홈서버 self-host
- 완료 기준: 두 계정 코멘트 시나리오, RLS 접근 테스트 통과

### M7. Claude Code 플러그인 패키징 (추후)

- 스킬 + 뷰어 + 런처를 플러그인으로 배포
- SessionStart 의존성 설치 훅, marketplace 배포
- AGENTS.md "추후 계획" 항목

## TRIP 운영 규칙

- 마일스톤 하나를 1개 이상의 TRIP 사이클로 진행한다. 계획 단위가 크면
  마일스톤 내에서 분할한다 (예: M3를 wireframe / diagram+code 두 사이클로).
- 버전: 마일스톤 완료 시 minor 상승 (M1 완료 = 0.2.0), 사이클 단위는 patch.
- 마일스톤 착수 전 이 문서를 읽고, 완료 시 상태(✅)와 ARCHI.md `(예정)`
  섹션을 갱신한다.
