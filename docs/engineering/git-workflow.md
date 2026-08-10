# Git 워크플로우

이 문서는 브랜치 전략, 커밋 메시지, PR 규칙, 머지 정책을 설명하는 단일 진실 원천이다.

## 브랜치

- 기본 작업 브랜치 prefix는 `codex/`를 사용한다.
- 브랜치 이름은 작업 의도를 짧게 드러낸다.
- 예: `codex/engineering-docs`, `codex/api-route-boundary`
- 실험 코드나 폐기 예정 코드는 제품 런타임 경로에 추가하지 않는다.

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
- staged source 파일을 Oxlint로 검사한다.

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

- main으로 병합하기 전 형식, Oxlint와 import graph 규칙, typecheck, 전체 unit·integration, production build, 단일 Chromium의 학습자·관리자 핵심 smoke를 PR Linux gate에서 통과해야 한다.
- main push는 동일 검사를 다시 중복하지 않고 Chromium·WebKit release E2E, Lighthouse와 source image Compose smoke를 추가로 차단하며, 모두 성공한 동일 revision만 image release 대상으로 삼는다. Staging k6는 해당 revision의 immutable digest를 staging에 배포·검증한 뒤 image release workflow에서 한 번만 실행한다.
- PR 필수 검증은 production 배포 환경과 같은 Linux에서 한 번 실행한다. Windows와 macOS 호환성은 매 PR 전체 matrix가 아니라 필요에 따른 설치 smoke나 주기 실행으로 다룬다.
- install은 manifest와 lockfile을 직접 읽는 package manager에 맡기고 frozen lockfile을 사용한다.
- 품질 workflow는 제품 동작을 검증하지 않는 coverage 집계와 workspace 실행 보고서를 만들지 않는다. Repository 계약·정책 검사기의 회귀 테스트는 automation이 실제 gate와 어긋나지 않도록 unit·integration suite와 함께 한 번 실행한다.
- 실패한 검증이 있다면 PR에 이유와 영향 범위를 남긴다.
- unrelated change를 같은 PR에 포함하지 않는다.
- 기존 사용자 변경을 되돌리지 않는다.
