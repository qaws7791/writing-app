# 관측성

이 문서는 로깅, 메트릭, 트레이싱, 알림, 대시보드 기준을 설명하는 단일 진실 원천이다.

## 현재 구현 상태

현재 코드에 구현된 관측성은 구조화 요청 로그가 중심이다.

- logger: `packages/logger`
- runtime: Pino
- API 적용: `apps/api`, `apps/admin-api`
- 요청 ID header: `x-request-id`
- 요청 완료 메시지: `request.completed`
- 자료실 공동 편집: 작업 공간 WebSocket 인증 거부 이유, HTTP transaction 거부·재시도, projection issue와 SQLite busy를 구조화해 기록한다.
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
- 외부에서 전달된 `x-request-id`는 보존한다.
- route가 예외를 던져도 finally에서 완료 로그를 남긴다.

## 로그 레벨

현재 `createAppLogger()` 기본 level은 `info`다.

권장:

- `info`: 요청 완료, 운영 이벤트
- `warn`: 복구 가능한 provider 실패, 권한 의심 이벤트
- `error`: 처리 실패, 내부 예외
- `debug`: 로컬 진단 전용

## 메트릭 후보

메트릭 backend 도입 시 우선 수집할 값은 다음과 같다.

- HTTP 요청 수와 status 분포
- endpoint별 p95/p99 duration
- 인증 실패 수
- 관리자 변경성 작업 수
- AI 피드백 요청 수, 실패 수, provider unavailable 수
- SQLite busy/lock 관련 실패 수
- seed/migration 성공/실패
- 작업 공간 연결 수·문서 구독 수·heartbeat 만료 수, HTTP transaction·projection latency와 실패 수, snapshot 크기

## 알림 후보

운영 알림 도입 시 초기 임계값 후보는 다음과 같다.

- 5분 동안 5xx 비율이 5% 초과
- p95 latency가 2초 초과 상태로 10분 지속
- 인증 실패 급증
- AI provider 실패율 급증
- SQLite lock/busy 오류 반복
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
