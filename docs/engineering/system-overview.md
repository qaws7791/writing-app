# 시스템 경계 원칙

## 목적

이 문서는 시스템이 지켜야 할 책임 경계와 의존성 방향을 정의한다. 현재 실행 앱, package, route, 데이터 저장소와 배포 구조는 코드·설정이 소유하므로 [사실별 권위 지도](../authority-map.md)를 통해 확인한다.

## 경계 원칙

- 사용자 화면은 데이터 저장소에 직접 접근하지 않고 공개 HTTP 계약만 소비한다.
- HTTP transport는 입력·세션·권한·응답 변환을 소유하고, 도메인 정책과 persistence 구현을 혼합하지 않는다.
- 도메인 policy와 use case는 HTTP framework·ORM·특정 provider에 의존하지 않는다.
- concrete persistence adapter와 실행 의존성 조립은 실행 경계가 소유한다.
- 데이터 schema, migration과 seed는 도메인 의미를 우회해 application 정책을 소유하지 않는다.
- 공유 UI는 화면별 데이터 조회, 라우팅, 인증과 도메인 상태 전이를 소유하지 않는다.
- 각 runtime은 자기 설정을 명시적으로 파싱하고, 환경 변수 원문을 도메인 경계 너머로 전달하지 않는다.

## 의존성 판단

새 의존성이나 책임을 추가할 때는 다음을 확인한다.

1. 사용자 가치나 운영 요구가 아닌 현재 구현의 편의만을 위해 새 경계를 만들지 않는다.
2. 한 방향의 data flow와 오류 변환 책임을 명시할 수 없다면 경계를 추가하지 않는다.
3. 공유 후보는 둘 이상의 독립 consumer와 독립적인 변경 수명을 입증할 때만 package로 분리한다.
4. 외부 I/O, secret, process lifecycle은 가장자리 runtime에 격리한다.
5. 현재 source 위치와 import graph는 repository tooling으로 확인하고, 이 문서에서 목록으로 복제하지 않는다.

## 변경 탐색

| 질문                        | 먼저 확인할 권위 소스                                 |
| --------------------------- | ----------------------------------------------------- |
| 현재 workspace·package 책임 | root와 workspace `package.json`, source import graph  |
| 현재 API·schema             | route registry, `packages/contracts`, runtime OpenAPI |
| 현재 persistence·migration  | `packages/db`와 app-owned adapter                     |
| 현재 배포 topology          | `deploy/compose/`, proxy 설정, release workflow       |
| 설계 이유                   | 관련 ADR와 이 문서의 경계 원칙                        |

## 독립성과 실패 격리

- 화면의 개별 장애는 다른 사용자 흐름의 정상 처리까지 중단시키지 않아야 한다.
- 공통 backend 경계의 장애 영향은 인증·인가 분리, health, timeout, 관찰과 복구 절차로 완화한다.
- 자동 복구가 데이터 손실을 키울 수 있는 경우 코드 복구와 데이터 복구를 분리하고 사람의 승인을 요구한다.
- 현재 구현이 이 원칙을 만족하는지의 판정은 문서 서술이 아니라 테스트와 운영 검증 보고서로 한다.
