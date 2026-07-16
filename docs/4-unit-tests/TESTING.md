# Testing Guidelines

## Test Framework

미정 — 뷰어 스캐폴딩 시 확정한다 (Vitest 우선 검토). 확정 후 본 문서와
ARCHI.md §14를 갱신한다.

## Running Tests

```bash
# 전체 테스트
pnpm test

# 특정 테스트
pnpm test <파일 경로 또는 -t "테스트명">

# 커버리지
pnpm test --coverage
```

(스캐폴딩 후 실제 스크립트 확정 시 갱신)

## Test Organization

- 테스트는 소스 파일 옆에 콜로케이션: `foo.ts` → `foo.test.ts`, 컴포넌트는 `Component.test.tsx`
- E2E/통합 테스트 구조는 구현 단계에서 결정

## Writing Tests

- 우선순위: ① 블록 JSON 스키마 검증 ② diff→블록 도출 로직(Grounding)
  ③ 런처 싱글턴 락/재사용 로직 ④ 렌더러 컴포넌트 스냅샷 ⑤ RLS 접근 시나리오
- 구조화 블록 도출 로직은 실제 git diff 픽스처 기반으로 테스트한다
- 시크릿 마스킹은 회귀 테스트를 반드시 유지한다

## Coverage Requirements

Not defined — 구현 단계에서 결정
