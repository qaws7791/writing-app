# 관찰 가능성 원칙

## 목적

이 문서는 장애 탐지·조사·복구에 필요한 관찰 기준을 정의한다. 현재 logger, event schema, metric, alert rule과 dashboard는 runtime source와 운영 설정이 소유한다.

## 원칙

- 요청과 운영 작업은 correlation 가능한 식별자, 결과, 지연, 오류 분류와 실행 revision을 남긴다.
- 로그는 구조화하고, secret·credential·원문 답안·불필요한 개인 정보를 기록하지 않는다.
- health는 process 생존이 아니라 의존성 준비 상태와 사용자 영향 판단에 필요한 신호를 제공해야 한다.
- alert는 사용자가 신고하기 전에 핵심 기능 불능, 데이터 보호 실패와 용량 위험을 알려야 한다.
- metric과 alert의 현재 값·임계값은 코드·설정이 소유하며, 문서는 그 선택 원칙만 기록한다.

## 운영 대응

1. alert에서 revision, request 식별자와 영향 범위를 찾는다.
2. 로그·metric·배포 기록을 연결해 원인과 고객 영향을 분리한다.
3. code rollback, 설정 복구, 데이터 복구 중 안전한 경로를 결정한다.
4. incident 결과와 개선 조치는 commit·환경·증거를 고정한 archive 기록으로 남긴다.

## 도입 판단

새 telemetry backend, dashboard 또는 alert channel은 운영자, 보존 기간, 접근 제어, 비용, 장애 시 동작과 복구 훈련 방법을 함께 결정한다.
