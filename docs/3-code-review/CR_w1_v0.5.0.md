# Code Review: /previs-recap — diff 기계 도출 recap 파이프라인 (M4 2/2)

**Review Date**: 2026-07-17  
**Version**: 0.5.0  
**Files Reviewed**:

- packages/recap/package.json
- packages/recap/tsconfig.json
- packages/recap/tsconfig.build.json
- packages/recap/vitest.config.ts
- packages/recap/src/git.ts
- packages/recap/src/source.ts (+ source.test.ts)
- packages/recap/src/inventory.ts (+ inventory.test.ts)
- packages/recap/src/excerpt.ts (+ excerpt.test.ts)
- packages/recap/src/masking.ts (+ masking.test.ts)
- packages/recap/src/manifest.ts (+ manifest.test.ts)
- packages/recap/src/derive.ts (+ derive.integration.test.ts)
- packages/recap/src/cli/derive.ts (+ cli/derive.test.ts)
- packages/recap/src/index.ts
- packages/schema/src/document.ts (+ document.test.ts)
- package.json
- skills/previs-recap/SKILL.md
- .claude/skills/previs-recap (심링크)
- AGENTS.md

**Plan**: docs/1-plans/F_0.5.0_previs-recap.plan.md

---

## Executive Summary

신규 `@previs/recap` 패키지가 git diff에서 recap 문서의 구조화 블록
(file-tree·diff)을 기계적으로 도출한다. Grounding·Budget·시크릿 마스킹을
CLI에 코드로 강제하고, 서사·와이어프레임·리스크 판단만 `/previs-recap`
스킬이 작성하는 하이브리드 구조다. diff 소스는 auto(merge-base·논리적
브랜치 동치·더티 게이트)와 `--range`/`--staged`/`--worktree` 오버라이드를
지원하며, 마스킹된 전체 patch는 out-of-line 파일로 분리한다. 스키마 변경은
`source.mode` optional 필드 추가(additive)뿐이다.

Codex 코드 리뷰는 1라운드에서 Major 3·Critical 1 포함 7건을 지적했고,
전부 수정 후 2라운드에서 신규 이슈 없이 수렴했다.

**APPROVED** (Codex loop, 2 rounds)

---

## Review (verbatim, round 2)

All seven prior findings are addressed, with no new blocking issues.

### Prior findings

1. “`--worktree` drops staged changes” — **Addressed.** Worktree now compares against `HEAD` at derive.ts:44.
2. “Deleted files are excluded from candidates” — **Addressed.** Only binary files are skipped at derive.ts:107.
3. “Untracked files receive zero churn/incorrect metadata” — **Addressed.** Synthetic numstat populates their statistics at derive.ts:48, with explicit untracked-path handling at derive.ts:83.
4. “Diff titles omit insertion/deletion counts” — **Addressed.** Titles now include counts while preserving the length budget at excerpt.ts:49.
5. “Excerpt truncation is not hunk-aware” — **Addressed.** Hunks are split and included atomically, with first-hunk internal truncation at excerpt.ts:77.
6. “Empty diffs succeed or produce invalid manifests” — **Addressed.** Empty change sets now raise an actionable `SourceError` at derive.ts:99.
7. “Secret masking leaks quoted JSON and spaced values” — **Addressed.** Separate quoted and bare-value patterns cover both forms at masking.ts:23, applied at masking.ts:56.

### New-issue checklist

1. Functional requirements — No new issues.
2. Code quality — No new issues.
3. Architectural compliance — No new issues.
4. Error handling — No new issues.
5. Security — No new exposures found.
6. Performance — No obvious regressions or resource leaks.

Approval gate is met based on the reported lint, type-check, and 245 passing tests. New logic has corresponding tests, and documentation changes match the plan's current implementation/release split.

APPROVED

---

## Round 1 findings (해결 완료)

- **Major** worktree가 bare `git diff`라 staged 변경 누락 → `['HEAD']` 비교로 수정.
- **Major** 삭제 파일이 diff 후보에서 제외됨 → 바이너리만 제외하도록 수정.
- **Major** untracked 파일 churn 0·메타데이터 오류 → `--no-index --numstat`
  합성 numstat으로 통계 정확화, untracked 경로 Set으로 명시화.
- **Critical** 마스킹이 따옴표 JSON 키(`"password":`)·공백 포함 값 유출 →
  `SECRET_QUOTED`/`SECRET_BARE` 분리로 커버.
- **Minor** diff 제목에 추가/삭제 카운트 누락 → `(+n −m)` 추가(70자 budget 유지).
- **Minor** 발췌 절단이 hunk 비인식 → hunk 단위 분할·첫 hunk 내부 절단으로 재작성.
- **Minor** 빈 diff가 성공/무효 manifest 생성 → `SourceError` 오류 종료.

---

## Verification

- `pnpm lint` clean · `pnpm typecheck` clean · `pnpm build` clean
- 테스트 245건 통과 (신규 recap 63건: 소스 해석·인벤토리 파싱·발췌 budget·
  마스킹 패턴·skip 판정 단위 + 임시 git 리포 통합 5건)
- 도그푸딩 E2E: 실범위 `v0.3.0..v0.4.1`(66파일) 도출 → file-tree·diff
  블록 조립 → `pnpm doc:validate` exit 0 확인. 랭킹·lockfile 강등·budget
  절단·out-of-line patch·마스킹 실전 동작 확인
