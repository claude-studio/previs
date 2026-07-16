# previs

> 코딩 에이전트의 작업 계획(plan)과 작업 회고(recap)를 사람이 검토하기 좋은
> 인터랙티브 비주얼 문서로 만들어주는 도구.

**Version**: 0.3.1 (M3 1/2 — 와이어프레임 렌더러)

## 무엇을 하나

- **plan** — 구현 착수 전 계획을 다이어그램·와이어프레임·파일 맵으로
  시각화해 리뷰어 승인 게이트 역할을 한다.
- **recap** — 구현 완료 후 PR/브랜치/diff를 변경의 "형태"로 요약해
  raw diff 이전의 리뷰 진입점을 제공한다.

문서는 기본적으로 로컬 `.previs/` 폴더에 JSON 블록으로 발행되며(로컬 우선),
협업 모드(Supabase)에서 코멘트·공유·피드백 루프를 지원한다.

## 문서 맵

| 문서 | 내용 |
|------|------|
| [AGENTS.md](AGENTS.md) | 프로젝트 공통 지침 (`CLAUDE.md`는 심볼릭 링크) |
| [docs/GOAL.md](docs/GOAL.md) | 전체 목표와 마일스톤 로드맵 (M0~M7) |
| [docs/ARCHI.md](docs/ARCHI.md) | 아키텍처 기준 문서 |
| [DESIGN.md](DESIGN.md) | 뷰어 UI 디자인 시스템 (블록 콘텐츠에는 미적용) |

## 개발

pnpm workspace 모노레포 (Node `^22.13.0 || >=24`, pnpm 10).

```bash
pnpm install
pnpm lint      # ESLint
pnpm typecheck # 패키지별 tsc --noEmit
pnpm test      # 빌드 후 Vitest 실행 (dist smoke 포함)
pnpm build     # 패키지별 tsc 빌드
```

핵심 패키지:

- [`packages/schema`](packages/schema) — 블록 JSON 스키마 (스킬·뷰어·저장
  계층이 공유하는 계약)
- [`apps/viewer`](apps/viewer) — 로컬 JSON 문서 뷰어. `pnpm --filter
  @previs/viewer dev`로 실행 (previs 전용 포트 대역 47738~47801)

## 개발 워크플로우

TRIP(Plan → Implement → Review → Test) 워크플로우로 진행하며, 계획·리뷰·테스트
문서는 `docs/` 하위에 축적된다. 자세한 규칙은 AGENTS.md를 본다.
