# 관찰 가능성 원칙

## 목적

이 문서는 장애 탐지·조사·복구에 필요한 관찰 기준을 정의한다. 현재 logger, request event schema, metric, alert rule과 dashboard는 runtime source와 배포 설정이 소유한다.

## 원칙

- 요청과 운영 작업은 correlation 가능한 식별자, 결과, 지연, 오류 분류와 실행 revision을 남긴다.
- 요청 완료 로그는 audience와 인증 middleware가 확인한 actor 종류를 포함하고, HTTP 결과와 client/server 오류 분류를 안정된 값으로 남긴다. 현재 event 계약은 [request event](../../packages/infra/observability/src/events.ts)가 소유한다.
- 공통 logger와 request·security event schema는 observability infra가 소유한다. API composition은 인증·인가 결과와 provider observer를 이 경계에 연결한다.
- 로그는 구조화하고, secret·credential·원문 답안·불필요한 개인 정보를 기록하지 않는다.
- provider와 object storage 실패는 원문 payload 대신 operation·phase·실패 종류·재시도 가능 여부로 분류한다.
- provider timeout과 provider 자체 실패는 장애 신호로 분류하되, caller 취소와 output 제한에 따른 정상 stream 종료는 provider 장애에서 제외한다.
- liveness는 process 생존만, readiness는 DB를 포함한 요청 처리 준비 상태를 나타내며 두 신호를 혼합하지 않는다.
- readiness는 의존성 check와 사용자 영향 신호를 함께 제공하고, liveness 응답에는 의존성 상태를 포함하지 않는다. 현재 응답 계약은 [learner health route](../../apps/api/src/http/health-routes.ts)와 [admin health route](../../apps/api/src/http/admin-foundation.routes.ts)가 소유한다.
- graceful shutdown은 drain 결과·timeout과 cleanup phase별 실패를 구조화해 남기고, logger flush는 다른 resource 정리 뒤 수행한다.
- alert는 사용자가 신고하기 전에 핵심 기능 불능, 데이터 보호 실패와 용량 위험을 알려야 한다.
- metric과 alert의 현재 값·임계값은 코드·설정이 소유하며, 문서는 그 선택 원칙만 기록한다.

## 로그 이벤트 계약

이벤트 이름과 보존 class는 [event 계약](../../packages/infra/observability/src/events.ts)이 소유한다. 아래 taxonomy에 속한 event는 `event`와 `retentionClass`를 실제 필드로 포함한다.

| 이벤트              | 허용하는 핵심 필드                                                                                              | 보존 class                               | level                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------- |
| `request.completed` | requestId, route template인 `path`, method, status, durationMs, audience, actorType/actorId, outcome/errorClass | `application-30d`                        | 결과와 무관하게 `info`            |
| `security.audit`    | requestId, action, template 기반 target, actorType/actorId, outcome, reasonCode, 제한된 clientIp/userAgent      | `security-90d`                           | 성공은 `info`, 거절·실패는 `warn` |
| `audit.recorded`    | category, action, actorId, targetId, requestId, outcome                                                         | `audit-1y` 또는 고위험 변경의 `audit-3y` | 성공은 `info`, 실패는 `warn`      |
| `ai.usage`          | requestId, provider, model, operation, durationMs, token 수 집계, outcome                                       | `ai-usage-1y`                            | 성공은 `info`, 실패는 `warn`      |

- `request.completed`의 `path`에는 실제 URL이나 query가 아니라 Hono가 매칭한 route template만 기록한다.
- request logger는 HTTP platform만 소유하고, security·audit·AI usage producer는 자기 event만 한 번 기록한다. 같은 의미의 이벤트를 일반 logger에 다시 복제하지 않는다.
- audit payload와 AI usage에는 이메일, 이름, 답안, feedback 원문, prompt와 provider 원문을 추가하지 않는다.
- pretty와 JSON은 표현 방식만 다르다. redaction과 이벤트 필드 구성은 transport 전에 한 번 적용한다.

AI 코칭 attempt metadata와 runtime 상태는 `@workspace/ai-feedback`이 소유하고, 기간별 품질 집계의 단일 조회 경계는 `@workspace/operations`의 read-only SQL repository가 소유한다. 이 조회는 request·success와 성공률, 정규화한 실패 code, latency, token 사용량과 재시도 횟수만 반환하며 답안, prompt와 feedback 원문을 조회하거나 응답에 포함하지 않는다. 운영 HTTP는 이 계약에 owner 인증과 `private, no-store`를 적용한다.

## 영속 감사와 security log

- operations의 DB audit는 인증된 owner가 수행한 개인정보 조회와 고위험 작업의 장기 보존 원장이다. request log는 HTTP 결과와 지연을, `security.audit`는 인증·인가 거절과 보안 판단을 소유하며 같은 row나 payload를 서로 복제하지 않는다.
- DB audit는 작업 전에 `started`로 기록하고 응답 결과에 따라 `succeeded | failed`로 종결한다. 사전 기록 실패는 작업을 차단하고 종결 실패는 성공 응답을 차단하되, 이미 저장한 `started` row는 조사 가능한 흔적으로 유지한다.
- 사용자 상세와 콘텐츠 발행·보관·보관 해제는 표준 감사 보존 class, 사용자 정지·활성화·삭제는 고위험 감사 보존 class를 적용한다. 실제 보존 기한과 index는 [operations schema](../../packages/modules/operations/src/infrastructure/persistence/schema.ts)가 소유한다.
- 감사 조회는 유효한 관리자 session을 다시 검증하고 private no-store 응답으로 제공한다. 이메일·이름·답안·prompt 같은 원문을 조회 계약에 추가하지 않는다.

## 운영 대응

1. alert에서 revision, request 식별자와 영향 범위를 찾는다.
2. 로그·metric·배포 기록을 연결해 원인과 고객 영향을 분리한다.
3. code rollback, 설정 복구, 데이터 복구 중 안전한 경로를 결정한다.
4. incident 결과와 개선 조치는 commit·환경·증거를 고정한 archive 기록으로 남긴다.

## 도입 판단

새 telemetry backend, dashboard 또는 alert channel은 운영자, 보존 기간, 접근 제어, 비용, 장애 시 동작과 복구 훈련 방법을 함께 결정한다.

현재 Pino stdout을 받는 Docker `json-file`의 크기 기반 회전은 `application-30d`와 `security-90d`의 일수 기반 파기 증거가 아니다. 일일 maintenance는 외부 sink, class별 실제 기간, 증거 식별자, 검증 시각과 유효기간이 담긴 구조화 증거를 JSON 결과에 연결하며 production actual 실행은 유효한 증거 없이는 실패한다. 외부 sink 설정, 접근 통제와 실제 class 삭제 검증은 아직 저장소에서 확인되지 않았으므로 production 출시 gate로 남는다.
