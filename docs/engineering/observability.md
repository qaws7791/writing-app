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
- readiness는 의존성 check와 사용자 영향 신호를 함께 제공하고, liveness 응답에는 의존성 상태를 포함하지 않는다. 현재 응답 계약은 [learner health route](../../apps/api/src/http/health-routes.ts)와 [admin health route](../../apps/api/src/admin/admin-foundation.routes.ts)가 소유한다.
- graceful shutdown은 drain 결과·timeout과 cleanup phase별 실패를 구조화해 남기고, logger flush는 다른 resource 정리 뒤 수행한다.
- alert는 사용자가 신고하기 전에 핵심 기능 불능, 데이터 보호 실패와 용량 위험을 알려야 한다.
- metric과 alert의 현재 값·임계값은 코드·설정이 소유하며, 문서는 그 선택 원칙만 기록한다.

## 운영 대응

1. alert에서 revision, request 식별자와 영향 범위를 찾는다.
2. 로그·metric·배포 기록을 연결해 원인과 고객 영향을 분리한다.
3. code rollback, 설정 복구, 데이터 복구 중 안전한 경로를 결정한다.
4. incident 결과와 개선 조치는 commit·환경·증거를 고정한 archive 기록으로 남긴다.

## 도입 판단

새 telemetry backend, dashboard 또는 alert channel은 운영자, 보존 기간, 접근 제어, 비용, 장애 시 동작과 복구 훈련 방법을 함께 결정한다.
