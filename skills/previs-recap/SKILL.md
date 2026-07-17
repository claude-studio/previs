---
name: previs-recap
description: 완료된 구현의 git diff에서 recap 문서를 기계적으로 도출해 로컬 .previs/에 발행합니다.
disable-model-invocation: true
---

# `/previs-recap`

완료된 구현의 변경을 리뷰어가 raw diff 이전에 "형태"로 파악할 수 있는 previs
recap 문서로 발행한다. 구조화 블록(file-tree·diff)은 `pnpm recap:derive` CLI가
git diff에서 기계적으로 도출하고, 서사·와이어프레임·리스크 판단만 직접 작성한다.

## 1. diff 소스 확정

사용자가 범위를 지정하면 그대로 CLI 옵션으로 전달하고, 없으면 auto로 도출한다.
어떤 범위를 다루는지 도출 전에 사용자에게 밝힌다.

- `--range <rev-range>` — 예: `v0.4.0..v0.4.1`, `main..HEAD`
- `--staged` — 스테이징된 변경 (index vs HEAD)
- `--worktree` — 워킹트리 변경 (untracked 포함)
- 인자 없음(auto) — base 브랜치와의 `merge-base..HEAD`. 워킹트리에 커밋되지
  않은 변경이 있으면 오류로 멈추므로, 그때는 `--range`/`--worktree`를 쓰거나
  커밋한다.

## 2. 도출

스크래치 경로에 manifest를 도출한다 (`--out`은 필수).

```bash
pnpm recap:derive --out <scratch>/recap-manifest.json [소스 옵션]
```

manifest 구조:

- `source` — 문서에 그대로 넣을 소스 메타 (`branch`·`commitRange`·`mode`)
- `stats` — 파일 수·추가·삭제 라인
- `skip` — recap 생략 권고 여부
- `fileTree` — file-tree 블록 (그대로 사용)
- `diffs[]` — diff 블록 후보. `rank`(낮을수록 우선)·`churn`·`demoted`(강등
  사유)와 `fullDiffPath`(마스킹된 전체 patch 파일 경로, manifest 위치 기준)
- `errors[]` — 파일 단위 비치명 오류

## 3. Skip·오류 게이트

- `skip.recommended`가 `true`면 발행하지 않고 사유를 보고하고 멈춘다. 사용자가
  강행을 지시하면 `--force`로 재도출한다.
- `errors`가 비어 있지 않으면(CLI가 exit ≠ 0) 발행하지 않고 오류 내용을
  보고한다.

## 4. recap 표준 골격 조립

manifest를 재료로 다음 순서의 JSON 블록 배열을 만든다. 해당 없는 블록은 생략한다.

1. `wireframe` 또는 `diagram` — 변경의 형태를 보여주는 헤드라인. 시맨틱 HTML
   조각과 `--wf-*` 토큰만 사용하고 hex 색상·`font-family`·고정 폭/높이/좌표를
   하드코딩하지 않는다.
2. `prose` — 1~3문단 서사(왜·무엇이 바뀌었나). 자유 서술이 허용되는 유일한 영역.
3. `data-model`·`api-endpoint` — diff에 실재하는 스키마/API 변경이 있을 때만.
   전사 근거는 manifest가 가리키는 마스킹된 전체 patch 파일(`fullDiffPath`)만
   읽어서 쓴다. raw `git diff`를 직접 실행하지 않는다. diff에서 확인되는
   사실만 담고, 확정할 수 없는 항목은 `inferred: true`로 표기한다.
4. `file-tree` — manifest의 `fileTree` 블록을 **변형 없이** 사용한다.
5. `tabs` "Key changes" — manifest `diffs` 후보 중 **최대 8개**를 선택한다.
   `rank`를 참고하되 의미 있으면 강등(`demoted`) 파일도 넣을 수 있다. 후보가
   3개 미만이면 있는 만큼만 만들고, 0개(바이너리 전용 diff 등)면 tabs를
   생략한다. 각 탭에는 후보의 `block`(diff 블록)을 그대로 넣는다 — diff
   텍스트·`title`·`note`를 수정하지 않는다. 판단 서술이 필요하면 별도 `prose`에.

콘텐츠 규칙: 구조화 블록에는 diff에서 기계적으로 도출된 사실만 담는다. 타이틀은
약 70자 이하로 유지하고, 시크릿은 이미 CLI가 마스킹하지만 직접 작성하는
서술에도 API 키·토큰·`.env` 값을 전사하지 않는다.

## 5. 발행 및 검증

1. 제목에서 소문자 영숫자와 하이픈으로 된 짧은 slug를 만든다.
2. 문서의 `schemaVersion`은 `1`, `kind`는 `recap`으로 설정하고 `source`에
   manifest의 `source`를 넣는다. 모든 블록에 고유한 `id`를 부여한다.
3. `id`를 `recap-YYYYMMDD-<slug>` 형식으로 만들고 `.previs/<id>.json`에 저장한다.
   날짜는 현재 날짜를 `YYYYMMDD`로 쓴다.
4. 같은 파일명이 이미 있으면 덮어쓰지 말고 `-2`, `-3`처럼 사용 가능한 접미사를
   붙여 id와 파일명을 함께 유일하게 만든다.
5. 저장 직후 검증한다.

   ```bash
   pnpm doc:validate .previs/<id>.json
   ```

6. 검증에 실패하면 JSON 블록을 수정하고 성공할 때까지 다시 검증한다. 검증 실패
   원본도 임의로 삭제하지 않아 수정할 수 있게 한다.

이번 스킬의 발행 대상은 previs 리포지토리 루트의 `.previs/`로 한정한다. 외부
대상 프로젝트나 `PREVIS_DOCS_DIR` 핸드오프는 후속 런처 작업의 범위다.

## 6. 뷰어 확인

뷰어 dev 서버가 이미 실행 중이면 출력된 로컬 URL을 열어 발행 문서를 확인하도록
안내한다. 실행 중이 아니면 다음 명령으로 직접 기동하도록 안내한다.

```bash
pnpm --filter @previs/viewer dev
```
