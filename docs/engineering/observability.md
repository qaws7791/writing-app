# 관측성

이 문서는 로깅, 메트릭, 트레이싱, 알림, 대시보드 기준을 설명하는 단일 진실 원천이다.

## 현재 구현 상태

> 2026-07-18: MTA-40 저장소 구성에서 통합 API의 learner/admin request log에 고정 `audience`를 추가했고, source·정적 계약과 target E2E 재배선까지 완료했다. 실제 Docker·운영 관찰은 아직 별도 승인 게이트다.

현재 코드에 구현된 관측성은 구조화 요청 로그가 중심이다.

- logger: `apps/api/src/observability`
- runtime: Pino
- target API 적용: `apps/api`의 learner/admin Host sub-app
- 요청 ID header: `x-request-id`
- 요청 완료 메시지: `request.completed`
- 자료실 HTTP: 문서 저장 성공과 `412` 충돌을 포함한 route·status·duration은 공통 `request.completed`로 관측한다. 제목과 Markdown 본문은 요청 로그에 포함하지 않는다.
- 자료실 자산: R2 업로드 뒤 DB 등록 rollback 정리 실패는 `admin.resource-library.asset-rollback.failed`, 영구 삭제 뒤 객체 정리 실패는 `admin.resource-library.asset-delete.failed`로 기록한다.
- 관리자 AI 채팅: 완료와 출력 byte 비용은 `admin.ai-chat.completed`, 요청 한도·동시 실행 거절은 `admin.ai-chat.request.rejected`, provider timeout은 `admin.ai-chat.provider.timeout`, 출력 상한 초과는 `admin.ai-chat.output.limit`, client 취소는 `admin.ai-chat.client.disconnected`로 기록한다.
- 학습자 AI 피드백: 예약과 `pending -> succeeded | failed | expired` 전이는 `ai.feedback.attempt.transition`으로 기록한다.
- 학습자 응답 계약 실패: `api.contract.response_invalid`로 계약명, field path, route, method, request ID, 배포 버전과 `response-schema-invalid` 분류만 기록한다. 응답 본문, 답안과 Zod message는 기록하지 않는다.

메트릭 수집기, tracing backend, alert manager, 운영 대시보드는 아직 코드로 구현되어 있지 않다. 이 문서의 메트릭/알림 항목은 도입 기준이다.

[ADR-0012](./adr/ADR-0012-single-api-runtime.md)에 따라 backend runtime을 통합했고, 저장소의 Compose·Caddy source configuration은 learner/admin public Host를 모두 `apps/api:4000`으로 보낸다. 요청 로그와 security audit event는 `apps/api/src/observability`, Hono logging middleware는 `apps/api/src/http/platform`이 소유한다. 외부 운영 관찰은 사용자 승인으로 이번 작업 범위에서 제외했으므로 실제 production 지표 성공을 주장하지 않는다.

`apps/api`의 통합 lifecycle은 SIGINT/SIGTERM 뒤 신규 요청을 `503`으로 닫고 response body와 명시적 장기 작업 lease까지 최대 20초 drain한다. 이후 요청 signal·body를 취소하고 server stop과 외부 provider cleanup을 공유 5초 deadline 안에서 시도한 뒤 SQLite client를 정확히 한 번 닫는다. 각 실패는 `cancel-activity`, `force-stop-server`, `cleanup-external`, `close-database` phase와 함께 기록한다. 학습자 AI 피드백은 caller abort와 provider timeout을 결합해 OpenAI 요청까지 전달하며, provider가 signal을 무시해도 시도 상태를 `failed`로 수렴시킨다.

## 요청 로그

요청 로그 필드는 다음과 같다.

| 필드                | 설명                                                                     |
| ------------------- | ------------------------------------------------------------------------ |
| `time`              | Pino timestamp                                                           |
| `level`             | Pino log level                                                           |
| `msg`               | `request.completed`                                                      |
| `requestId`         | runtime이 생성해 응답 header에도 넣는 server request ID                  |
| `externalRequestId` | 형식·길이 검증을 통과한 외부 `x-request-id`, 없거나 유효하지 않으면 생략 |
| `audience`          | route 실행 전 app이 고정한 `learner` 또는 `admin` sub-app 분류           |
| `method`            | HTTP method                                                              |
| `path`              | query를 제외한 요청 path                                                 |
| `status`            | 응답 status                                                              |
| `durationMs`        | monotonic clock 기준 duration                                            |
| `actorId`           | 인증이 완료된 경우의 learner 또는 admin 식별자                           |
| `actorType`         | 인증이 완료된 경우 `learner` 또는 `admin`                                |

`audience`는 raw public `Host`를 기록하는 값이 아니라 Host dispatcher 뒤의 sub-app 분류다. production role이 learner/admin public API Host를 서로 다르게 강제하므로 해당 환경에서 audience별 오류율·p95는 각 public API audience의 관찰 단위가 된다. internal alias와 literal hostname까지 분리해야 하는 조사에는 Caddy 또는 proxy access log를 별도로 사용한다.

## RequestLoggingRuntime

요청 ID 생성과 duration 측정은 `RequestLoggingRuntime` capability로 주입한다.

- production 기본 request id: `crypto.randomUUID()`
- duration clock: `performance.now()`
- 테스트는 generator와 monotonic clock을 주입해 결정적으로 검증한다.

## 로그 정책

- token, password, OAuth 비밀값, API key를 로그에 남기지 않는다.
- request body 전체를 기본 로그에 남기지 않는다.
- path에는 query 비밀값이 포함될 수 있으므로 필요 시 query 제거 정책을 둔다.
- 서버가 생성한 `requestId`를 응답 `x-request-id`와 모든 내부 이벤트의 상관관계 ID로 사용한다.
- 외부 `x-request-id`는 128자 이하의 제한된 문자 집합만 `externalRequestId`로 별도 보존한다. 검증에 실패한 값은 폐기한다.
- route가 예외를 던져도 finally에서 완료 로그를 남긴다.

## 구조 이벤트 계약

- `request.completed`: audience, method, path, status, duration, server request ID와 인증 후 actor만 기록한다.
- `request.failed`: 5xx의 오류 class, message를 제거한 stack frame, cause class와 server request ID만 기록한다.
- `security.audit`: 가입·로그인 실패, 401/403, owner 변경 작업과 AI quota 초과를 기록한다.
- `ai.usage`: model, input/output/total token 수만 기록한다. prompt와 provider 응답 본문은 기록하지 않는다.
- `ai.feedback.attempt.transition`: attempt ID와 번호, 학습자·레슨·스텝 ID, 이전/다음 상태, `reserved | provider-succeeded | provider-failed | ttl-expired` 이유를 기록한다. idempotency key, 답안, provider 결과는 기록하지 않는다.
- `api.contract.response_invalid`: contract name, 실패 field path, route, method, request ID와 `DEPLOYMENT_VERSION`만 기록한다. 클라이언트에는 같은 request ID를 가진 `500 INTERNAL_SERVER_ERROR`만 반환한다.
- request body, cookie, authorization header, token, password, provider payload는 어떤 구조 이벤트에도 포함하지 않는다.
- owner 변경 감사 이벤트에는 actor ID, body를 제외한 target, 성공·거절·실패 결과를 남긴다. 로그 sink는 이벤트를 갱신하지 않고 append-only로 취급한다.

## 로그 레벨

현재 `createAppLogger()` 기본 level은 `info`다.

`LOG_PRETTY=true`은 어느 환경에서나 사람이 읽기 쉬운 출력 transport를 강제한다. `LOG_PRETTY=false`은 `NODE_ENV=development`여도 JSON 로그를 강제하며, 값이 없을 때만 development 기본값이 pretty 출력이다. CI·container·수명주기 test는 명시적 `false`로 transport 해석과 구조 로그 형식을 결정적으로 유지한다.

권장:

- `info`: 요청 완료, 운영 이벤트
- `warn`: 복구 가능한 provider 실패, 권한 의심 이벤트
- `error`: 처리 실패, 내부 예외
- `debug`: 로컬 진단 전용

## 파생 메트릭

구조 로그 집계기는 다음 값을 5분 단위로 계산한다.

- HTTP 요청 수와 status 분포
- endpoint별 p95/p99 duration
- 인증 실패 수
- 관리자 변경성 작업 수
- AI 피드백 요청 수, 429 수, provider unavailable 수, model별 input/output token 합계와 모델 단가를 적용한 예상 비용
- SQLite busy/lock 관련 실패 수
- seed/migration 성공/실패
- 자료실 문서 저장의 성공·`412`·5xx 수와 R2 객체 정리 실패 수

## 초기 경보 기준

| 경보             | 계산식과 초기 임계값                                                                             | 재현 방법                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| HTTP 5xx         | 5분간 `status >= 500 / 전체 요청 > 5%`, 최소 20건                                                | fault route 2건과 정상 route 18건을 호출한다.                                |
| 인증·인가 실패   | 5분간 `authentication.failed`와 `authorization.denied` 합계 20건 이상 또는 이전 1시간 평균의 3배 | 유효하지 않은 test auth token으로 401/403을 20회 호출한다.                   |
| rate/quota       | 5분간 HTTP 429가 10건 이상                                                                       | AI attempt limit fixture로 `/ai-feedback`을 반복 호출한다.                   |
| AI provider 실패 | 5분간 AI 요청 중 503 비율이 10% 초과, 최소 10건                                                  | provider failure stub으로 503을 2건, 성공을 8건 만든다.                      |
| AI 비용          | `ai.usage`의 model별 token 합계에 운영 단가를 적용한 시간당 예상 비용이 예산의 80% 초과          | usage callback fixture에 정해진 input/output token을 주입해 합계를 비교한다. |
| SQLite busy      | 5분간 SQLite `BUSY` 또는 `LOCKED` class가 3건 이상                                               | 두 connection의 write lock fixture로 busy timeout 초과를 3회 만든다.         |
| latency          | p95가 2초를 초과한 상태가 10분 지속                                                              | 지연 fixture로 2초 초과 요청을 주입한다.                                     |

경보 집계 테스트는 request body, cookie, authorization, token 문자열이 이벤트에 없다는 assertion과 함께 실행한다. 임계값 변경은 이 표와 운영 alert rule을 같은 변경에서 갱신한다.

추가 운영 경보는 다음과 같다.

- health check 실패
- migration 실패

## 대시보드 후보

- API별 요청량, 오류율, latency
- learner/admin Host sub-app health
- AI 피드백 성공/실패
- 관리자 변경성 작업 이력
- SQLite 파일 크기와 백업 상태
- 배포 버전과 최근 rollback 여부

## 향후 도입 기준

다음 조건이 생기면 메트릭/tracing backend 도입 ADR을 작성한다.

- 운영 사용자 트래픽이 지속적으로 발생한다.
- 장애 분석에 요청 로그만으로 부족하다.
- AI provider 비용/실패 추적이 필요하다.
- SQLite lock 또는 latency 문제가 반복된다.
- 여러 서버/프로세스 간 request correlation이 필요하다.
