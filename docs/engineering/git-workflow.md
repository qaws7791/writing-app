# Git 워크플로우

이 문서는 브랜치 전략, 커밋 메시지, PR 규칙, 머지 정책을 설명하는 단일 진실 원천이다.

## 브랜치

- 기본 작업 브랜치 prefix는 `codex/`를 사용한다.
- 브랜치 이름은 작업 의도를 짧게 드러낸다.
- 예: `codex/engineering-docs`, `codex/api-route-boundary`
- 실험 코드나 폐기 예정 코드는 `Kwep/`에 추가하지 않는다.

## 커밋 메시지

커밋 메시지는 한국어로 작성한다.

형식:

```text
<80자 이하 요약>

- 상세 설명 1
- 상세 설명 2
```

최근 커밋 이력도 한국어 요약을 사용한다. 예:

- `core 모듈 구조를 재정렬`
- `api route 테스트를 구현 근처로 이동`
- `학습자 API 의존성 경계 정리`

## 커밋 전 확인

기본 확인 명령:

```bash
git status --short
bun lefthook run pre-commit
```

필요에 따라 다음 명령을 추가로 실행한다.

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

## Git hook

Lefthook 설정은 루트 `lefthook.yml`을 기준으로 한다.

pre-commit:

- staged 파일을 Oxfmt로 포맷한다.
- 변경된 workspace만 Turbo 필터 기반 lint를 실행한다.

pre-push:

- `bun run lint`를 실행한다.

## PR 규칙

PR 본문에는 다음을 포함한다.

- 변경 목적
- 주요 변경 파일 또는 경계
- 검증 명령과 결과
- 남은 위험 또는 후속 작업
- 문서 갱신 여부

PR은 가능한 작은 단위로 유지한다. 아키텍처, DB, 인증, UI를 한 PR에 섞어야 한다면 이유를 명시한다.

## 리뷰 기준

리뷰는 formatting보다 correctness, naming, coupling, boundary clarity를 우선한다.

중점 확인:

- 런타임 경계가 유지되는가?
- 권한과 인증이 명시적인가?
- DB migration/seed가 데이터 보존 정책을 지키는가?
- 테스트가 동작 계약을 고정하는가?
- 문서가 최신 코드와 일치하는가?

## 머지 정책

- main 또는 기본 브랜치로 머지하기 전에 lint, typecheck, test를 가능한 범위에서 통과시킨다.
- 실패한 검증이 있다면 PR에 이유와 영향 범위를 남긴다.
- unrelated change를 같은 PR에 포함하지 않는다.
- 기존 사용자 변경을 되돌리지 않는다.
