# P13 오류·보안·관측성 통합 검증

## 판정 기준

P13은 `406d9511`을 기준으로 오류 표현, 보안 경계, 외부 I/O와 운영 신호를 통합 점검했다. 코드와 자동 검증으로 확인할 수 없는 production network 도달성은 추론으로 닫지 않고 P14 배포 검증 범위로 남겼다.

## 오류와 결정성

- P13에서 확인한 domain command·validation의 예상 가능한 거절은 판별 가능한 decision 또는 `Result`다. settings validation과 document version 검사는 `null` 대신 각각 명시적 decision과 `Result`를 반환하고, AI feedback CAS의 모호한 `Result<boolean, ...>`도 `transitioned | not-pending` variant로 교체했다.
- quota consume과 delete-pending reconciliation 조회는 repository의 DB 예외를 typed persistence error로 바꾸고 application까지 `Result`로 전달한다. provider·storage 호출도 P13에서 점검한 application 경계에서 원문 예외를 공개하지 않는 typed error로 바꾼다. 이 보장은 해당 adapter의 실제 DB 실패와 application failure-path test로 검증했으며, 저장소 전체의 모든 `Promise`가 절대 reject하지 않는다는 뜻으로 확대하지 않는다.
- [HTTP exhaustive helper](../../../packages/infra/http-platform/src/errors/assert-exhaustive-http-result.ts)와 [typecheck fixture](../../../packages/infra/http-platform/src/errors/http-result-exhaustiveness.typecheck.ts)를 실제 여섯 module HTTP mapper에 연결했다. 새 오류 variant를 mapper에서 누락하면 typecheck가 실패한다.
- [P13 정적 gate](../../../scripts/check-package-interfaces.ts)는 module별 TypeScript program에서 추론형·alias·contextual 반환 타입까지 해석해 validation·decision 함수의 `null` 반환을 거부한다. [고의 위반 fixture](../../../scripts/fixtures/p13-null-decision-gate.ts)가 이 검출 자체를 회귀 검증한다. 같은 gate가 domain·application의 직접 현재 시간·무작위 ID 생성, boolean Result, domain `JSON.stringify` 비교, `emitSerial`, transaction file의 provider import와 정제 전 client IP header 접근도 거부한다.
- aggregate·event 공개 타입의 불변성은 [kernel typecheck fixture](../../../packages/shared/kernel/src/domain-event.typecheck.ts)와 content·identity·learning domain test로 확인했다. 검색의 빈 목록과 optional read의 `null`은 정상적인 조회 부재이고 command 실패를 대신하지 않는다는 것을 application port와 호출부에서 대조했다.

## 인증·인가와 browser security

- learner/admin URL·cookie·table·session lifecycle 분리와 admin signup 차단은 auth server·integration test로 확인했다. learner 상태, admin role과 password 변경의 session 폐기는 identity service와 API revoker·foundation test로 확인했다.
- [route parity inventory](../../../apps/api/src/test-support/p10-route-parity.ts)에 public/protected 분류를 추가하고 learner/admin OpenAPI 전체 route의 cookie security scheme을 실제 문서와 대조했다.
- API는 [전용 client IP adapter](../../../packages/infra/http-platform/src/security/trusted-client-ip.ts)만 사용한다. Caddy는 신뢰 proxy parsing 결과인 `{client_ip}`로 전용 header를 덮어쓰며 admin BFF도 이 header만 전달한다. 이 문법과 덮어쓰기 의미는 [Caddy `trusted_proxies` 문서](https://caddyserver.com/docs/caddyfile/options#trusted-proxies)와 [`reverse_proxy` header 문서](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#headers)로 확인했다.
- auth, operations와 ai-feedback 제한 상태는 각 owner의 schema에 분리되어 있으며 정적 gate가 owner 간 table 참조를 거부한다. 보호 middleware는 session·role 판정 전에 private cache header를 예약하고 공통 오류 handler도 이를 보존하므로 인증 실패와 인가 거절 응답까지 `private, no-store`와 `Vary: Cookie`를 유지한다. CORS, trusted origin, Host allowlist, cookie 속성, CSRF 성격의 Origin 검증과 CSP도 config·HTTP·app test 전체를 다시 통과했다.
- public error fuzz fixture는 SQL, provider 원문, credential, 개인정보와 stack sentinel이 HTTP 응답에 들어가지 않음을 검증한다.

## AI·storage·event 안전성

- AI feedback prompt test는 provider 입력을 lesson 제목·focus·저장 답안으로 제한하고 learner ID, curriculum ID와 idempotency key를 제외한다. provider adapter와 application test는 timeout과 caller `AbortSignal` 합성을 검증하며 operations SSE도 제한 시간과 request abort signal을 provider에 전달한다.
- transaction source의 provider/storage import 금지는 정적 gate로 고정했다. R2 upload/delete는 결정적 object key를 compensation과 reconciliation에 그대로 사용하며 storage 호출을 DB transaction 안에서 기다리지 않는다.
- content·identity·learning·resource application test는 commit 후 publish 순서와 dispatch 실패가 이미 commit된 성공을 rollback으로 바꾸지 않음을 검증한다. event bus test는 listener를 병렬 정산하며 `emitSerial`과 in-memory 권위 projection은 정적 gate가 거부한다.

## 관측성과 운영

- [request event](../../../packages/infra/observability/src/events.ts)는 request ID, audience, actor type, duration, `succeeded | failed` 결과와 client/server 오류 분류를 요구한다. 각 module 인증 middleware는 이미 검증한 actor를 공통 request context에 기록하므로 별도 인증 조회는 추가되지 않는다.
- security audit test는 owner mutation, 인증 실패, 인가 거절과 AI quota 거절을 분리한다. event publish, operations provider의 시작·stream 소비·timeout, resource upload·compensation·delete와 reconciliation 조회·metadata 실패는 원문 없이 stable event kind·operation·phase·retry 가능 여부로 기록한다. caller 또는 output 제한에 따른 정상 stream 취소는 provider 장애로 기록하지 않는다.
- 인증에 성공했지만 관리자 권한 또는 학습자 상태 때문에 거절된 요청도 authorization 검사 전에 공통 request actor를 기록하므로 request 완료 로그와 security audit가 동일 actor를 유지한다.
- logger test는 대소문자·구분자·배열·child binding을 포함한 secret, credential, authorization, cookie, session, token, 원문 답안과 개인정보 key를 재귀적으로 마스킹한다.
- learner/admin readiness는 DB check와 사용자 영향 신호를 함께 반환하고 liveness는 process 생존만 반환한다. lifecycle test는 request drain 뒤 unsubscribe, AI close, DB close, logger flush 순서와 단계별 실패 격리를 확인한다.
- 제품 source에는 OpenTelemetry·Sentry import나 새 dashboard가 없다. transitive package metadata의 optional telemetry 항목은 제품 backend 도입으로 판정하지 않았다.

## 자동 검증

| 검증                                                      | 결과                                      |
| --------------------------------------------------------- | ----------------------------------------- |
| `bun run format:check`                                    | 통과                                      |
| `bun run check:package-interfaces`                        | P13 정적 gate 포함 통과                   |
| `bun run typecheck`                                       | 27개 task 통과                            |
| `bun run test`                                            | 22개 workspace task 통과                  |
| 명시적 production origin/API URL을 주입한 `bun run build` | API, web, admin, Storybook 4개 build 통과 |
| 변경 package와 API의 개별 typecheck·test                  | 모두 통과                                 |

`bun run check:deployment-config`는 현재 host에 `docker` 실행 파일이 없어 Compose 해석 전에 중단됐다. P13 로직 실패로 보지 않았고, 배포 automation을 소유하는 P14에서 실행 가능한 도구 환경과 함께 다시 검증한다.

## trade-off와 증거 한계

전용 client IP header는 일반 전달 header를 여러 runtime에서 다시 파싱하는 것보다 신뢰 경계가 작고 유지보수가 쉽다. 대신 API 또는 admin container가 신뢰 network 밖에 직접 공개되지 않는다는 배포 전제가 필요하다. Caddy 설정과 애플리케이션 소비 경로는 검증된 사실이지만 실제 production network ACL은 이 저장소만으로 확정할 수 없으므로 P14 검증 대상이다.

정적 gate는 금지 패턴의 재도입을 빠르게 막지만 모든 의미론을 수학적으로 증명하지는 않는다. 따라서 Result·불변성·commit 순서·redaction·shutdown은 typecheck fixture와 실행 test를 함께 근거로 사용했다.
