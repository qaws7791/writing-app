# 관측성

이 문서는 로깅, 메트릭, 트레이싱, 알림, 대시보드 기준을 설명하는 단일 진실 원천이다.

## 현재 구현 상태

현재 코드에 구현된 관측성은 구조화 요청 로그가 중심이다.

- logger: `packages/logger`
- runtime: Pino
- API 적용: `apps/api`, `apps/admin-api`
- 요청 ID header: `x-request-id`
- 요청 완료 메시지: `request.completed`
- 자료실 본문 동기화: HTTP transaction 거부·재시도, sync 응답 종류, projection issue와 SQLite busy를 구조화해 기록한다.
- 자료실 작업 공간 사건: `/resources/events` WebSocket의 인증 거부 이유, 연결·문서 구독·heartbeat 만료를 구조화해 기록하며 본문 Yjs binary는 기록하거나 전송하지 않는다.
- 자료실 트리: event revision gap을 `resource-tree.revision-gap` performance mark로 기록하고 보이는 트리를 다시 조회한다.
- 관리자 AI 채팅: 완료와 출력 byte 비용은 `admin.ai-chat.completed`, 요청 한도·동시 실행 거절은 `admin.ai-chat.request.rejected`, provider timeout은 `admin.ai-chat.provider.timeout`, 출력 상한 초과는 `admin.ai-chat.output.limit`, client 취소는 `admin.ai-chat.client.disconnected`로 기록한다.

메트릭 수집기, tracing backend, alert manager, 운영 대시보드는 아직 코드로 구현되어 있지 않다. 이 문서의 메트릭/알림 항목은 도입 기준이다.

## 요청 로그

요청 로그 필드는 다음과 같다.

| 필드         | 설명                                       |
| ------------ | ------------------------------------------ |
| `time`       | Pino timestamp                             |
| `level`      | Pino log level                             |
| `msg`        | `request.completed`                        |
| `requestId`  | 외부 `x-request-id` 또는 runtime 생성 UUID |
| `method`     | HTTP method                                |
| `path`       | 요청 path                                  |
| `status`     | 응답 status                                |
| `durationMs` | monotonic clock 기준 duration              |
| `userId`     | 필요한 경우 학습자 식별자                  |
| `adminId`    | 필요한 경우 관리자 식별자                  |

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

- `request.completed`: method, path, status, duration, server request ID와 인증 후 actor만 기록한다.
- `request.failed`: 5xx의 오류 class, message를 제거한 stack frame, cause class와 server request ID만 기록한다.
- `security.audit`: 가입·로그인 실패, 401/403, owner 변경 작업, AI quota 초과, WebSocket 인증 거절을 기록한다.
- `ai.usage`: model, input/output/total token 수만 기록한다. prompt와 provider 응답 본문은 기록하지 않는다.
- request body, cookie, authorization header, token, password, provider payload는 어떤 구조 이벤트에도 포함하지 않는다.
- owner 변경 감사 이벤트에는 actor ID, body를 제외한 target, 성공·거절·실패 결과를 남긴다. 로그 sink는 이벤트를 갱신하지 않고 append-only로 취급한다.

## 로그 레벨

현재 `createAppLogger()` 기본 level은 `info`다.

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
- 작업 공간 연결 수·문서 구독 수·heartbeat 만료 수, HTTP transaction·projection latency와 실패 수, snapshot 크기

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
- 학습자 API와 어드민 API health
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
