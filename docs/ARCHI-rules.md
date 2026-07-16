# Architecture Documentation Rules

[ARCHI.md](ARCHI.md)는 previs 아키텍처를 문서화한다. 각 작업(기능 추가,
리팩터링, 버그 수정) 후 ARCHI.md 갱신 필요 여부를 판단한다.

## When to Update

다음을 변경하는 모든 작업 후 갱신한다:

- 프로젝트 구조 (§4 Project Structure — 새 디렉토리, 파일 이동, 모노레포 전환)
- 기술 스택 (§3 Technology Stack — 의존성 추가/변경, `(예정)` → 확정 전환)
- 핵심 원칙 (§5 Core Architecture Principles — 블록 모델, 시각 계층 등)
- 블록 렌더러/UI 구조 (§8 Components & UI Architecture)
- 데이터 모델·RLS (§9 Data Model & Backend)
- 에이전트 연동 계약 (§10 Agent Integration)
- 런처 동작 (§11 Local Launcher)
- 데이터 플로우 (§12 diagrams — 흐름이 바뀌면 다이어그램도 갱신)

## How to Update by Change Type

### Major Feature / Refactor

검토: §2 Overview, §4 Structure, §5 Principles, §8~§12 해당 섹션 전부

### Minor Feature / Enhancement

갱신: §8 Components, §9 Data Model, §10 Agent Integration 중 해당 섹션

### Bug Fix

보통 갱신 불필요. 단, 아키텍처 결함을 드러내거나 고친 경우 해당 섹션 갱신

### Dependency Changes

갱신: §3 Technology Stack + 영향받는 아키텍처 섹션

### 사전 구현 단계 특칙

`(예정)` 표기 섹션이 실제 코드로 구현되면 표기를 제거하고 실제 구조를 반영한다.

## Guidelines

- 정확하고 사실 기반으로 — 실제 코드베이스를 반영한다
- 간결하게 — 이해에 필요한 수준까지만, 구현 세부는 제외
- 데이터 플로우가 바뀌면 mermaid 다이어그램도 갱신
- 실제 파일 경로를 참조한다
