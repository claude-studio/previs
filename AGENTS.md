# previs

> **previs** (previsualization) — 영화 제작에서 본 촬영 전에 장면을 미리 시각화하는 공정.
> 코딩 에이전트의 작업 계획(plan)과 작업 회고(recap)를 사람이 검토하기 좋은
> 인터랙티브 비주얼 문서로 만들어주는 도구.

이 파일은 작게 유지한다. 영역별 상세 규칙은 별도 문서/스킬로 분리하고,
해당 영역을 수정하기 전에 그 문서를 먼저 읽는다.

## 프로젝트 개요

BuilderIO의 `visual-plan` / `visual-recap` 스킬에서 영감을 받아, 호스티드 SaaS 의존 없이
자체 인프라에서 동작하도록 재구성하는 프로젝트다. 두 가지 산출물을 지원한다:

- **plan** — 구현 착수 전, 계획을 다이어그램·와이어프레임·파일 맵·미해결 질문이 담긴
  검토용 문서로 시각화. 리뷰어 승인 게이트 역할.
- **recap** — 구현 완료 후, PR/브랜치/diff를 리뷰어가 raw diff를 열기 전에
  변경의 "형태"를 파악할 수 있는 요약 문서로 시각화.

## 아키텍처 방향 (확정)

| 계층 | 선택 | 이유 |
|------|------|------|
| 뷰어 | React SPA (TypeScript) | 블록 렌더러를 자체 구현 |
| 콘텐츠 포맷 | **JSON 블록 배열** (MDX 아님) | DB 저장 콘텐츠의 런타임 코드 실행 위험 제거 |
| 백엔드/협업 | Supabase (Auth + RLS + Realtime + Storage) | 코멘트·공유·피드백 루프를 백엔드 코드 없이 구현 |
| 에이전트 연동 | Claude Code 스킬 `/plan`, `/recap` | 에이전트가 JSON 블록 문서를 작성·발행 |
| 시각화 재료 | rough.js(손그림), mermaid(다이어그램), shiki(코드) | 전부 MIT |
| UI 프리미티브 | shadcn/ui + Tabler Icons | 원본 와이어프레임 아이콘 체계(Tabler)와 일치 |

### 미결 사항

- [ ] 우선 용도: 개인 도구 vs 팀 리뷰 (코멘트/Auth 범위가 달라짐)
- [ ] Supabase: cloud vs 홈서버 self-host (데이터 주권 요구 수준에 따라)
- [ ] Claude Code 플러그인 패키징 여부 (스킬 + 뷰어 배포 방식)

## 라이선스 경계 (중요 — 반드시 준수)

> 원칙: **"규칙은 MIT에서, 설계는 눈으로, 코드는 새로"**

- ✅ **자유롭게 개조 가능**: [`BuilderIO/skills`](https://github.com/BuilderIO/skills)의
  visual-plan/visual-recap SKILL.md + references 텍스트 — **MIT** (Copyright 2026 Builder.io).
  저작권 고지 유지 조건.
- ✅ **자유**: 블록 스키마 구성, UX 패턴, 아키텍처 등 아이디어 차원의 참고.
- ❌ **금지**: [`BuilderIO/agent-native`](https://github.com/BuilderIO/agent-native) 저장소의
  소스 코드·문서 복사. LICENSE 파일이 없는 저장소다 (2026-07 확인, `templates/plan`은
  `private: true`). 참고 열람만 하고 코드와 문장은 반드시 새로 작성한다.

## 콘텐츠 규칙 (MIT 스킬에서 이식)

에이전트 스킬과 렌더러를 구현할 때 아래 규칙을 유지한다:

1. **Grounding Rule** — 구조화 블록(diff, data-model, api-endpoint, file-tree)은
   실제 변경 라인에서 기계적으로 도출된 사실만 담는다. 모델의 자유 서술은
   산문 블록(왜, 리스크 판단)에만 허용. diff에 없는 사실은 빼거나 "inferred" 표기.
2. **Recap Canonical Shape** — UI 와이어프레임 헤드라인 → 1~3문단 서사 →
   스키마/API 변경 → 변경 파일 트리 → "Key changes" diff 탭 순서.
3. **Budget** — Key-change 탭 3~8개, 발췌는 탭당 ~150줄 미만, 타이틀 ~70자 이하.
   철저함을 핑계로 budget을 넘기지 않는다.
4. **시크릿 마스킹** — diff에 포함된 API 키·토큰·.env 값은 절대 전사하지 않고
   마스킹(`sk-•••`, `<redacted>`)한다.
5. **와이어프레임 체계** — 시맨틱 HTML 조각 + `--wf-*` 테마 토큰(라이트/다크 자동 반전)
   + surface 프리셋(browser/desktop/mobile/popover/panel). hex 색상·font-family·
   폭/높이/좌표 하드코딩 금지. 룩(테마·rough.js 스케치)은 렌더러가 소유한다.
6. **Skip 조건** — 작고 명백한 단일 파일 diff는 recap을 만들지 않는다
   (요약이 오히려 리뷰 오버헤드).

## 작업 규칙

- 현재 브랜치에 머문다. 사용자가 명시적으로 요청하지 않는 한 브랜치
  생성·전환·삭제·리셋·리베이스를 하지 않는다.
- 커밋 메시지·PR 등 GitHub 메타데이터에 AI attribution(`Co-Authored-By`,
  에이전트 라벨 등)을 넣지 않는다.
- 의존성을 추가할 때는 기억에 의존하지 말고 `npm view`/`pnpm view` 또는
  최신 문서로 현재 버전을 확인한 뒤 추가한다.
- 코드 주석은 최소화한다. 코드가 스스로 보여줄 수 없는 제약(미래 수정이
  다시 밟을 함정 등)만 한두 줄로 남기고, 다음 줄이 뭘 하는지·변경이 왜
  옳은지는 쓰지 않는다.
- TypeScript만 사용한다. `.js`/`.mjs` 소스 파일을 추가하지 않는다.

## 데이터 규칙

- 스키마 변경은 추가(additive)만 허용한다. 마이그레이션에서 테이블/컬럼
  drop·rename·truncate 등 파괴적 변경을 하지 않는다.
- 대용량 원본(이미지·스크린샷·영상·base64 본문)은 SQL에 넣지 않는다.
  Supabase Storage에 저장하고 URL/핸들만 테이블에 남긴다.
- 소스·문서·테스트·픽스처 어디에도 실제 API 키·토큰·시크릿처럼 보이는
  리터럴을 하드코딩하지 않는다. 예시에는 명백한 가짜 값을 쓴다.

## 뷰어 UX 규칙

- 낙관적(optimistic) UI를 기본으로 한다: 캐시 즉시 갱신 후 에러 시 롤백.
  파괴적 작업 외에는 클릭을 막는 스피너를 쓰지 않는다.
- 브라우저 `alert`/`confirm`/`prompt` 금지 — shadcn/ui 다이얼로그 사용.
- 표준 컨트롤(드롭다운·팝오버·모달)은 shadcn/ui 프리미티브로. 절대 위치
  지정으로 커스텀 구현하지 않는다.
- 아이콘은 Tabler Icons. 이모지를 1급 아이콘으로 쓰지 않는다.

## 로컬 뷰어 실행 규칙 (설계 확정)

로컬에서 뷰어 서버를 띄울 때 세션마다 프로세스가 중복 생성되는 것을 방지한다:

- SessionStart 훅에서 서버를 띄우지 않는다. 스킬 호출 시점에 런처가 "재사용 우선"으로 기동.
- 런처는 `/api/viewer-info` 헬스 엔드포인트로 정체(name/version) 확인 후 재사용 판단.
- 동시 기동 경쟁은 원자적 락(`fs.open(lockPath, 'wx')`)으로 차단 (macOS에 flock CLI 없음).
- 유휴 30분 시 서버 자동 종료. 포트는 프로젝트 경로 해시로 유도(프로젝트별 싱글턴).

## 저장소 설정

- git identity는 `~/Desktop/jb/` includeIf로 FRONT-JB(개인 계정)가 자동 적용된다.
  remote는 `git@github.com:claude-studio/previs.git` 그대로 두면 insteadOf 재작성이
  `github-personal.com` 알리아스로 라우팅한다. 별도 설정 금지.
- `CLAUDE.md`는 `AGENTS.md`의 심볼릭 링크다. 내용은 AGENTS.md에만 작성한다.
