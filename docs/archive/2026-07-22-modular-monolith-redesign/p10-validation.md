# P10 구현 증거

## 경계와 소유권

| 구분          | P10 이후 소유자                                           | 검증 경계                                                                        |
| ------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 설정·Clock·ID | API main과 `runtime` adapter                              | 환경 원문은 main에서 한 번만 parse하고 내부에는 검증된 설정과 port만 전달        |
| 의존성 조립   | `composition/create-container.ts`                         | logger→DB→event bus→AI→storage→auth 뒤 여섯 module과 route를 공개 facade로 조립  |
| HTTP 조립     | `composition/create-app.ts`와 `http`                      | 공통 request ID·Host 경계 뒤 learner/admin realm과 audience별 middleware를 mount |
| 상태·종료     | `runtime/api-health.ts`와 `lifecycle/server-lifecycle.ts` | liveness/readiness를 분리하고 drain 뒤 event→AI→DB→logger 순서로 정리            |

기존 `api-runtime`, `learner-api-core`, 최상위 app forwarding, app-owned module 디렉터리와 learner 전용 lifecycle 호환 facade는 제거했다. package interface 검사는 제거 경로, 검증 전 환경 원문, runtime 밖의 직접 시간·UUID 호출과 dependency package private alias의 재도입을 거부한다.

## 검증된 구현

- `main.ts`만 환경 원문을 읽고 `parseApiEnv` 결과로 container를 만든다. main과 E2E 진입점은 `import.meta.main`으로 실행을 제한해 factory import가 server·DB·signal side effect를 만들지 않는다.
- system Clock과 UUID adapter를 한 번 선택해 module, request ID, event ID와 domain ID generator에 주입한다. module composition은 전체 env가 아니라 필요한 설정·port만 받는다.
- container는 auth와 identity의 순환 협력을 좁은 bridge로 연결하고 content·identity query, ai-feedback application, reporting·command·knowledge port를 명시적으로 조립한다.
- content, identity, learning과 resource-library의 event publisher는 같은 typed in-memory bus를 사용한다. document 저장 event 발행 실패는 이미 성공한 저장을 실패로 바꾸지 않고 구조화 관찰 대상으로 남긴다.
- 초기화 중 실패하면 등록 완료된 logger, DB, event subscription과 AI 정리를 생성 역순으로 실행한다. cleanup 하나의 실패가 다음 정리를 막지 않으며 반복 dispose는 같은 Promise로 수렴한다.
- unified app이 request ID를 Host 검사보다 먼저 만들고 learner/admin request logger가 이 값을 재사용한다. Host 거절도 correlation ID와 `no-store`를 유지한다.
- learner와 admin은 별도 auth realm, origin·CORS와 private cache 정책을 유지한다. body/origin 같은 예상 가능한 보안 거절과 module Result는 route 계약에서 변환하며 global handler는 예상하지 못한 결함만 내부 오류로 정규화한다.
- learner·admin readiness는 같은 SQLite probe를 사용하고 liveness는 DB를 조회하지 않는다. readiness의 운영용 503 body는 learner domain 오류 정규화와 분리했다.
- shutdown은 신규 요청 수락을 먼저 멈추고 response body와 long-lived lease까지 drain한다. timeout 시 active connection과 activity를 취소한 뒤 subscription, AI, DB, logger를 순서대로 정리하고 drain·phase 실패를 구조화해 기록한다.
- signal handler와 lifecycle shutdown은 각각 중복 호출을 멱등 처리한다. 실제 child process 검증은 진행 응답 drain, DB close 1회와 port 반환까지 확인한다.

## route·OpenAPI·frontend parity

P0 기준선과 runtime OpenAPI를 `p10-route-parity.ts`에서 method·path 단위로 대조했다. learner 12개, admin 40개 OpenAPI operation이 실제 등록 route와 정확히 일치했다. 이 중 P0 기준선 47개는 유지됐고, 두 audience의 liveness와 P9에서 승인된 AI 변경안 검토 3개를 승인 추가 5개로 분류했다. 미분류 차이와 결함은 0개다.

Better Auth wildcard handler와 OpenAPI 문서 자체 경로는 Hono OpenAPI route registry 대상이 아니므로 위 operation 집계에서 제외했다. 대신 두 realm의 mount·session 동작과 문서 응답을 HTTP test로 별도 검증했다.

P0 frontend consumer inventory의 learner·admin route를 다음 세 겹으로 전수 대조했다.

1. API OpenAPI test가 module registry의 실제 method·path와 기준선 fixture의 완전 일치를 검사한다.
2. Web HTTP adapter와 Admin capability adapter test가 실제 URL·method·header를 검사한다.
3. 두 frontend transport는 각 adapter가 전달한 canonical Zod success schema를 실행하며 package interface 검사가 이 경계를 고정한다.

따라서 inventory에 기록된 frontend 소비 route의 method·path·wire schema 미대응 항목은 0개다. 이는 저장소의 정적 consumer와 test fixture에 대한 100% 대조이며, 저장소 밖의 미등록 외부 consumer가 없다는 증거는 아니다.

## 자동 검증

권위 도구인 Bun 1.3.10과 Node.js 24.x에서 확인한 결과를 기록한다.

| 검증                           | 결과                                                                  |
| ------------------------------ | --------------------------------------------------------------------- |
| API composition·HTTP·lifecycle | API 26 files·137 tests와 typecheck 통과                               |
| resource event 경계            | resource-library 11 files·41 tests와 typecheck 통과                   |
| OpenAPI parity                 | learner 12개·admin 40개 operation exact match, 승인 추가 5개·결함 0개 |
| API build                      | Bun target으로 1,912 modules bundle 통과                              |
| architecture·interface         | 29-workspace dependency graph와 package interface 검사 통과           |
| 전체 회귀                      | root test 22 tasks와 typecheck 27 tasks 통과                          |
| production build·정적 품질     | API·Web·Admin·Storybook 4 builds와 root lint·Oxfmt 통과               |

환경값 없는 production build는 기존 정책대로 `production web origin is required`에서 fail-fast했다. 성공 build에는 quality-gates workflow와 같은 비밀 아닌 example origin만 사용했으며 parser 기본값은 완화하지 않았다. Storybook의 기존 vendor directive·chunk warning은 종료 코드를 실패시키지 않았다.

`bun lefthook run pre-commit`은 정상 종료했지만 staged file이 없어 개별 hook은 실행되지 않았다. 동일 범위보다 넓은 root lint와 Oxfmt 검사를 별도로 통과했으며, 사용자 변경을 임의로 stage하지 않았다.

## 선택과 trade-off

- 하나의 container가 두 HTTP audience와 SQLite lifecycle을 공유한다. 설정·connection·종료 owner가 하나라 유지보수와 장애 진단은 단순해지지만, learner와 admin을 독립 확장하거나 독립 복구할 수는 없다. 현재 독립 배포 필요를 입증한 운영 근거가 없다는 ADR 판단을 유지한다.
- process-local event bus는 빠르고 type-safe하며 shutdown 시 정리가 단순하지만 durable delivery나 재생을 보장하지 않는다. 저장 완료처럼 commit 이후 비핵심 효과만 사용하고, 전달 보장이 필요해지면 outbox 등 별도 설계가 필요하다.
- readiness마다 SQLite를 직접 probe해 stale cache를 피했다. 요청당 작은 query 비용이 생기므로 health 호출량이나 DB contention 근거가 생길 때만 제한·cache를 검토한다.
- drain timeout 뒤에는 가용한 시간 안에 종료하기 위해 강제 취소로 전환한다. 장기 응답의 완전 종료보다 배포 수렴을 우선하는 선택이며 timeout·취소 결과를 로그로 남겨 운영자가 영향을 판정할 수 있게 했다.

## 추론과 제한

source graph, 임시 SQLite 통합 test, 실제 child process 종료 test, runtime OpenAPI와 Bun bundle을 근거로 단일 API 조립과 로컬 lifecycle이 보존됐다는 결론은 강한 추론이다. production traffic, 실제 OAuth·OpenAI·object storage, 운영 DB, 다중 instance, proxy drain과 배포 signal 전달은 검증하지 않았으므로 검증된 사실로 간주하지 않는다.
