# Code Review: 로컬 런처 — 싱글턴 뷰어 서버 (M5)

**Review Date**: 2026-07-18  
**Version**: 0.6.0  
**Plan**: `docs/1-plans/F_0.6.0_local-launcher.plan.md`

## Files Reviewed

- `packages/launcher/package.json`·`tsconfig.json`·`tsconfig.build.json`·`vitest.config.ts`
- `packages/launcher/src/paths.ts` (+ paths.test.ts)
- `packages/launcher/src/lock.ts` (+ lock.test.ts)
- `packages/launcher/src/port.ts` (+ port.test.ts)
- `packages/launcher/src/health.ts` (+ health.test.ts)
- `packages/launcher/src/launch.ts` (+ launch.integration.test.ts)
- `packages/launcher/src/cli/up.ts`
- `apps/viewer/server/previs-runtime-plugin.ts` (+ previs-runtime-plugin.test.ts)
- `apps/viewer/vite.config.ts`
- `package.json`·`pnpm-lock.yaml`
- `skills/previs-plan/SKILL.md`·`skills/previs-recap/SKILL.md`

## Executive Summary

로컬 뷰어를 재사용 우선으로 기동하고 원자적 락, 정체 확인, 전용 포트 탐색, 유휴 종료 및 프로세스 정리를 제공한다.

첫 리뷰에서 Major 2건이 발견됐으며 모두 수정됐다. 후속 리뷰에서 신규 차단 이슈는 발견되지 않았다.

Codex 코드 리뷰는 1라운드에서 Major 2건을 지적했고, 전부 수정 후 2라운드에서 신규 이슈 없이 수렴했다.

**APPROVED** (Codex loop, 2 rounds)

## Findings

### F-01 — Major — 락 없는 기존 뷰어를 건너뛰어 중복 기동

**Final status**: Addressed

기존 구현은 점유 포트를 건너뛰기만 해 동일한 standalone 뷰어가 이미 실행 중이어도 다음 포트에 두 번째 서버를 기동했다.

- 점유 포트의 `/api/viewer-info`를 검사하고 동일한 `docsDir`이면 `adopt`로 반환: `packages/launcher/src/port.ts:43`
- 채택한 뷰어의 PID와 포트를 running 락에 기록하고 재사용 결과 반환: `packages/launcher/src/launch.ts:298`
- 계획에도 lockless viewer 채택 흐름 반영: `docs/1-plans/F_0.6.0_local-launcher.plan.md:127`

### F-02 — Major — pnpm 래퍼 종료를 전체 프로세스 그룹 종료로 오판

**Final status**: Addressed

기존 구현은 직접 자식인 pnpm 래퍼가 종료되면 Vite 자손도 종료됐다고 간주해, 고아 Vite 프로세스를 남긴 채 락을 제거할 수 있었다.

- 음수 PGID를 사용한 프로세스 그룹 생존 확인: `packages/launcher/src/launch.ts:104`
- SIGTERM 후 bounded 대기 및 SIGKILL 에스컬레이션: `packages/launcher/src/launch.ts:113`
- 직접 자식 상태와 무관하게 프로세스 그룹 전체 정리: `packages/launcher/src/launch.ts:124`
- 정리 완료를 기다린 뒤 소유한 starting 락 제거: `packages/launcher/src/launch.ts:327`

### OBS-01 — v0.6.0 changelog 부재

**Final status**: Overridden / deferred

changelog와 버전 확정은 TRIP-3 릴리스 단계에서 처리한다는 구현자 설명을 수용했다. 계획 역시 아키텍처와 목표 문서 갱신을 릴리스 시점 작업으로 구분한다.

- 릴리스 시 문서 갱신 항목: `docs/1-plans/F_0.6.0_local-launcher.plan.md:320`

## Additional Remediation

빌드 산출물에 테스트 파일이 포함되고 stale `dist/*.test.js`가 실행되던 문제도 함께 정리됐다.

- 전용 build tsconfig 사용: `packages/launcher/package.json:7`
- 테스트 소스 build 제외: `packages/launcher/tsconfig.build.json:11`
- 공유 포트 대역을 사용하는 테스트 파일 직렬 실행: `packages/launcher/vitest.config.ts:7`

## Checklist

- [x] Functional requirements
- [x] Code quality
- [x] Architectural compliance
- [x] Error handling and resource cleanup
- [x] Security and safety
- [x] Performance and practical operation
- [x] Plan conformance
- [x] New logic has corresponding automated or documented E2E verification
- [x] Lint, type-check, tests, and build pass
- [x] All review findings are addressed or explicitly deferred

> Review tooling caveat: `.claude/skills/TRIP-review/cr-template.md` and `checklist.md` were absent from the current worktree. This record follows the repository-established TRIP review structure and the same checklist sections and severity gate used throughout the review loop.

## Verification

- Lint: clean
- Type-check: clean
- Tests: 281 passed, 36 new
- Build: clean
- E2E: 콜드스타트, 재사용, 락 없는 뷰어 채택, 중복 미기동, SIGTERM 정리 검증
- `git diff --check HEAD`: clean
