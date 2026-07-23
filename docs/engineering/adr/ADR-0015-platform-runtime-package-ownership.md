# ADR-0015: 플랫폼 runtime package 소유권 재평가

## 상태

부분 대체됨 — 환경 설정 package 유지 결정은 유효하지만, HTTP·관측 구현의 app-local 위치 결정은 [ADR-0020](./ADR-0020-module-owned-vertical-slices.md)의 infra·module 수직 경계가 대체한다.

## 날짜

2026-07-18

## 맥락

단일 API runtime 전환 전에는 `apps/api`와 `apps/admin-api`가 `@workspace/hono`와
`@workspace/logger`를 함께 소비했다. 이때 두 package는 중복된 HTTP·관측성 정책을 막는
실제 공유 경계였다. MTA-41에서 legacy `apps/admin-api`를 제거하면 consumer graph와 package의
독립 가치가 달라진다. 반면 `@workspace/env`는 API뿐 아니라 학습자 웹과 관리자 웹도 소비한다.

이 ADR은 MTA-41 뒤의 목표 graph를 평가하기 위해 현재 source에서 `apps/admin-api/**`를 제외한
production import를 조사했다. 따라서 다음 두 사실을 구분한다.

- 검증된 사실: legacy 경로를 제외하면 `@workspace/env`의 실행 앱 consumer는 `apps/api`,
  `apps/web`, `apps/admin` 세 개이고, `@workspace/hono`와 `@workspace/logger`의 실행 앱 consumer는
  각각 `apps/api` 하나다.
- 검증된 사실: 이 ADR 작성 시점의 공유 working tree에는 MTA-41 삭제 작업이 아직 병렬로
  진행 중이다. 위 결과는 삭제될 경로를 제외해 계산한 target graph이며, MTA-41 완료 revision에서
  같은 검색을 다시 실행해야 한다.
- 추론: 현재 확인되지 않은 미래 API app 또는 외부 consumer가 생길 수 있다. 가능성만으로
  package를 유지하지 않고, 실제 두 번째 consumer가 생길 때 재추출한다.

package 경계는 파일 수를 줄이는 목적이 아니라 서로 다른 owner와 변경 주기를 격리하는
수단이다. 단일 consumer의 framework adapter를 package로 유지하면 dependency와 탐색 비용은
늘지만 배포·변경 독립성은 생기지 않는다. 반대로 여러 실행 앱이 같은 의미를 공유하는 작은
계약을 한 앱에 흡수하면 의미 drift와 중복 위험이 커진다.

## 확인한 public API와 결합

### `@workspace/env`

- public entrypoint는 `./local-runtime-defaults`, `./parse-env` 두 개다. private deep import는
  package 외부에 없다.
- `local-runtime-defaults`는 API, 학습자 웹, 관리자 웹의 local origin과 base URL을 한 topology로
  제공한다. 세 앱은 독립 build/runtime consumer다.
- `parse-env`의 production 검증은 HTTPS·비-localhost URL, 영구 DB URL, learner/admin secret의
  entropy와 상호 분리, production test auth 금지, cookie domain과 발급·소비 origin의 일치를
  fail-closed로 검사한다.
- `parse-env`의 직접 production consumer는 `apps/api` 하나지만, 검증 대상에는 두 frontend의
  public origin과 두 API Host의 인증 경계가 함께 포함된다. `local-runtime-defaults`도 같은
  값을 사용하므로 package 책임은 단순한 API process parser보다 배포 topology 계약에 가깝다.
- package runtime dependency는 `zod` 하나이고 public surface는 명시적 subpath 두 개로 제한된다.

### `@workspace/hono`

- public entrypoint는 `./core`, `./errors`, `./security`, `./zod` 네 개이며 legacy를 제외한 모든
  production import는 `apps/api`에 있다.
- `core`는 OpenAPI Hono app·route 조립, `errors`는 공개 오류 응답과 내부 500 로그의 redaction,
  `security`는 cookie mutation의 trusted-origin 검사·1 MiB body limit·private no-store를 제공한다.
  `zod`는 `@hono/zod-openapi`의 `z`를 다시 공개한다.
- 이 API는 framework-neutral하지 않다. `hono`, `@hono/zod-openapi`, API error shape와 Hono
  middleware lifecycle에 직접 결합된다. 단일 runtime으로 합쳐진 learner/admin sub-app은
  독립 package consumer가 아니라 같은 executable의 HTTP edge다.
- package 자체 test는 보안·오류 invariant의 가치 있는 회귀 증거지만, test의 존재는 독립 runtime
  owner가 있다는 증거가 아니다. test를 실제 owner와 함께 이동해도 invariant를 유지할 수 있다.

### `@workspace/logger`

- manifest는 root와 세 subpath를 공개하지만 package 외 production import는 모두 root entrypoint를
  사용하고, legacy를 제외한 실행 앱 consumer는 `apps/api` 하나다.
- 구현은 Pino logger 생성뿐 아니라 Hono request middleware, learner/admin audience와 actor,
  request ID 정규화, 인증 실패·권한 거부·AI quota 초과·owner mutation 보안 event를 함께 소유한다.
- request ID는 외부 값을 128자 이하의 제한된 문자 집합으로만 수용하고 내부 ID와 분리한다.
  보안 event는 성공과 실패의 log level을 구분한다. 이 observer contract는 흡수 뒤에도 약화할 수
  없는 보안·관측성 invariant다.
- 이 surface는 범용 logger보다 현재 API의 Hono transport와 업무 audience에 결합되어 있다.
  독립 package로 남겨도 별도 배포, versioning 또는 변경 owner는 생기지 않는다.

## 결정

### `@workspace/env`: 유지

`packages/env`를 세 실행 앱이 공유하는 환경·local topology 계약 owner로 유지한다.

- `local-runtime-defaults`와 `parse-env` 두 explicit subpath를 유지한다.
- frontend는 secret-bearing parser를 import하지 않고 local public topology만 소비한다.
- API는 production secret·origin·cookie invariant를 동일 package에서 검증한다.
- legacy port와 이름은 MTA-41 완료 topology에 맞게 제거하되, 이는 package 흡수 근거가 아니라
  공유 계약의 값 갱신이다.
- 새 export는 둘 이상의 실제 runtime이 동일 의미로 소비하거나, 이 package가 소유한 deployment
  security invariant일 때만 추가한다.

### `@workspace/hono`: `apps/api`에 흡수

`packages/hono`의 source와 test를 `apps/api`의 HTTP platform 경계로 이동하고 workspace package를
삭제한다.

- 권장 owner는 `apps/api/src/http/platform`이다. app factory, route definition, error mapping,
  OpenAPI Zod adapter와 request security middleware를 함께 소유한다.
- 기존 네 public entrypoint와 wildcard 호환 wrapper를 남기지 않는다. API 내부 import는
  `@/http/platform/...`의 명시적 app alias로 전환한다.
- trusted-origin, body limit, private no-store, stable public error body, 내부 오류 stack redaction과
  OpenAPI route typing의 test fixture를 source와 같은 변경에서 이동한다.
- Hono 또는 OpenAPI 라이브러리 교체는 이 결정의 범위가 아니다.

### `@workspace/logger`: `apps/api`에 흡수

`packages/logger`의 source와 test를 `apps/api`의 observability 경계로 이동하고 workspace package를
삭제한다.

- Pino 생성, request log와 security audit event는 `apps/api/src/observability`가 소유한다.
- Hono request logging middleware는 `apps/api/src/http`가 소유하고 observability의 좁은 logger
  port를 import한다. 이 배치는 transport adapter와 event contract를 구분한다.
- root barrel 또는 기존 package subpath의 호환 wrapper는 남기지 않는다.
- learner/admin audience, actor, internal/external request ID, duration, audit action·outcome·level과
  `LOG_PRETTY` 우선순위를 보존하는 test를 source와 함께 이동한다.
- logging backend 교체와 event schema 변경은 이 결정의 범위가 아니다.

`hono`와 `logger`의 흡수는 서로 독립적으로 병합하고 rollback할 수 있다. 단, 두 이동과 package
삭제가 완료되기 전에는 목표 package graph의 최종 수용 조건을 충족한 것으로 보지 않는다.

## 대안과 트레이드오프

### 세 package 모두 유지

- 장점: source 이동이 없고 기존 package test와 import가 그대로 유지된다.
- 단점: 단일 API owner인 `hono`와 `logger`에 가짜 독립성을 남긴다. package manifest, export,
  workspace task와 interface guard를 유지하지만 별도 consumer나 release cadence는 없다.
- 결론: `env`에는 맞지만 `hono`와 `logger`에는 맞지 않는다.

### 세 package 모두 `apps/api`에 흡수

- 장점: workspace 수와 package navigation이 가장 단순해진다.
- 단점: 두 frontend가 쓰는 local topology를 API가 소유하게 되고 frontend가 API 내부 코드를
  import하거나 값을 복제해야 한다. 독립 build 사이의 URL drift 가능성이 커진다.
- 결론: `hono`와 `logger`에는 맞지만 `env`에는 맞지 않는다.

### `hono` 또는 `logger`를 범용 platform package로 유지·재설계

- 장점: 미래 두 번째 API가 같은 정책을 즉시 재사용할 수 있다.
- 단점: 현재 consumer 없이 framework-neutral abstraction을 설계하면 실제 요구보다 추상화가
  앞서고, Hono·Pino와 업무 audit 의미를 감춘다.
- 결론: 채택하지 않는다. 실제 두 번째 runtime이 같은 의미로 소비할 때 현재 app-local source와
  test를 package로 다시 추출하는 편이 가역적이다.

## 확장성·유지보수성·보안·성능 영향

- 확장성: `env`의 공통 topology는 실행 앱이 늘어도 한 계약으로 확장된다. HTTP·logger 재추출은
  두 번째 실제 runtime이 생긴 뒤 수행해도 source와 test가 함께 있어 비용이 제한적이다.
- 유지보수성: `hono`와 `logger`의 변경 owner가 `apps/api`로 명시되어 capability와 framework
  변경을 한 workspace에서 탐색할 수 있다. 대신 `apps/api`의 코드량은 늘지만 응집도는 높아진다.
- 보안: package 삭제 자체로 invariant를 바꾸지 않는다. 관련 source와 test를 원자적으로 이동하고
  architecture guard가 transport→DB와 private import 금지를 계속 강제해야 한다.
- 성능: 세 package는 source-level import이므로 흡수만으로 유의미한 runtime 성능 향상은 예상하지
  않는다. 이는 측정되지 않은 추론이다. 결정의 주효과는 dependency graph와 ownership 단순화다.
- release coupling: `hono`와 `logger`는 이미 `apps/api`와 함께 배포되므로 흡수해도 실제 release
  coupling이 증가하지 않는다. `env`는 세 build consumer를 연결하므로 독립 package가 변경 영향을
  명시적으로 드러낸다.

## 후속 구현 경계

### Hono 흡수

1. `packages/hono/src`의 source·test를 `apps/api/src/http/platform`으로 이동한다.
2. `apps/api` import를 app alias로 전환하고 Hono peer/runtime dependency를 API manifest에만 둔다.
3. `packages/hono`, workspace package reference, interface snapshot과 obsolete architecture 문자열을
   제거하거나 app-local boundary 검사로 대체한다.
4. package 외 `@workspace/hono` import가 0이고 기존 보안·오류·OpenAPI test가 모두 통과해야 한다.

### Logger 흡수

1. logger factory·event contract·test를 `apps/api/src/observability`로, Hono middleware와 test를
   `apps/api/src/http`로 이동한다.
2. API import와 manifest를 갱신하고 `packages/logger`와 workspace reference를 제거한다.
3. package 외 `@workspace/logger` import가 0이며 request/audit fixture의 event payload가 이동 전과
   동일해야 한다.

두 구현은 각각 별도 diff로 검증할 수 있다. 한 구현 실패가 다른 package 결정이나 `env` 유지에
영향을 주지 않도록 atomic move와 package 삭제를 같은 diff에 묶는다.

## 롤백

- `env` 유지 결정은 runtime 변경이 없으므로 ADR을 재검토하면 된다. legacy topology 값 갱신은
  해당 MTA-41 변경 단위로 되돌린다.
- Hono 흡수 rollback은 `packages/hono` source·test·manifest와 네 export를 복원하고 API import,
  dependency와 guard를 같은 revision에서 되돌린다. app-local과 package 구현을 동시에 남기지 않는다.
- logger 흡수 rollback은 `packages/logger` source·test·manifest를 복원하고 API import,
  dependency와 guard를 같은 revision에서 되돌린다. event compatibility wrapper는 만들지 않는다.

## 검증

MTA-41 완료 revision과 각 흡수 revision에서 다음을 실행한다.

```bash
rg -n --glob '!docs/**' '@workspace/env/(local-runtime-defaults|parse-env)' apps packages scripts
rg -n --glob '!docs/**' '@workspace/hono(?:/|$)' apps packages scripts
rg -n --glob '!docs/**' '@workspace/logger(?:/|$)' apps packages scripts

bunx bun@1.3.10 run check:package-interfaces
bunx bun@1.3.10 run check:architecture-boundaries
bunx bun@1.3.10 run check:import-cycles
bunx bun@1.3.10 run lint
bunx bun@1.3.10 run typecheck
bunx bun@1.3.10 run test
bunx bun@1.3.10 run build
```

완료 판정은 다음을 모두 요구한다.

- `@workspace/env` consumer가 API·학습자 웹·관리자 웹의 explicit subpath에 한정된다.
- `@workspace/hono`, `@workspace/logger` production/test import와 workspace manifest reference가 0이다.
- `packages/hono`, `packages/logger`가 없고 compatibility wrapper나 duplicate implementation이 없다.
- env production validation, HTTP security/error/OpenAPI, request/security audit fixture가 이동 전 의미로
  통과한다.
- import cycle과 API transport boundary 위반이 0이다.

## 재검토 조건

- `env`: 실행 앱들이 더 이상 같은 local topology·production origin 의미를 공유하지 않거나 각 앱의
  배포 계약이 독립적으로 분리될 때 유지 결정을 재검토한다.
- `hono`: `apps/api`와 독립 배포되는 두 번째 Hono runtime이 동일한 error·security·route 의미를
  실제로 소비할 때 package 재추출을 검토한다.
- `logger`: 독립 실행 앱 둘 이상이 동일한 request/audit event schema와 Pino adapter를 실제로
  소비하고 변경 주기도 분리될 때 package 재추출을 검토한다.

## 구현 결과

2026-07-18에 이 결정을 다음과 같이 반영했다.

- `packages/env`와 두 explicit subpath는 유지했다.
- Hono/OpenAPI core·error·security source와 test를 `apps/api/src/http/platform`으로 이동하고
  `packages/hono` workspace와 API dependency를 제거했다.
- Pino factory·request/security audit event를 `apps/api/src/observability`로, Hono request logging
  middleware와 test를 HTTP platform으로 이동하고 `packages/logger` workspace와 API dependency를
  제거했다. Pino와 pretty transport는 API의 직접 runtime dependency가 됐다.
- API source·manifest의 `@workspace/hono`, `@workspace/logger`, `#hono` 참조는 0개이며 호환
  wrapper와 duplicate implementation을 남기지 않았다.
- frozen install, API lint·typecheck, package interface와 architecture boundary 검사가 통과했다.
  이동한 HTTP platform test 21개, observability test 11개와 API 전체 58개 파일·311개 test가
  통과했다.

### 2026-07-23 대체 관계

위 구현 결과는 단일 API 전환 시점의 app-local 경계 기록이다. 후속 모듈러 모놀리스 개편에서는 module HTTP interface가 공통 transport·관측 계약을 실제로 함께 소비하므로 HTTP platform과 observability를 infra package로 다시 분리했다. API는 runtime 조립과 제품별 관찰 연결만 소유한다. 현재 package 위치와 공개 surface는 manifest가 권위이며, 경계 판단에는 ADR-0020과 시스템 경계 원칙을 사용한다.
