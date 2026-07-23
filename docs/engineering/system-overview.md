# 시스템 경계 원칙

## 목적

이 문서는 시스템이 지켜야 할 책임 경계와 의존성 방향을 정의한다. 현재 실행 앱, package, route, 데이터 저장소와 배포 구조는 코드·설정이 소유하므로 [사실별 권위 지도](../authority-map.md)를 통해 확인한다.

## 경계 원칙

- 사용자 화면은 데이터 저장소에 직접 접근하지 않고 공개 HTTP 계약만 소비한다.
- HTTP transport는 입력·세션·권한·응답 변환을 소유하고, 도메인 정책과 persistence 구현을 혼합하지 않는다.
- 도메인 policy와 use case는 HTTP framework·ORM·특정 provider에 의존하지 않는다.
- concrete persistence adapter는 해당 module infrastructure가 소유하고 실행 의존성 조립은 API composition이 맡는다.
- 여러 runtime이 공유하는 인증 vendor integration과 credential·session schema는 좁은 auth infra package가 소유한다. 제품 profile·사용자 상태·role policy는 identity module이 소유하며, API의 auth adapter가 vendor-neutral identity directory port를 구현한다. identity module은 auth runtime·schema를 직접 읽지 않는다.
- content module은 draft 편집, immutable published revision, 발행·보관·reset과 콘텐츠 schema·seed를 함께 소유한다. learning과 operations에는 table이 아니라 공개 query port를 제공하고 AI 변경안에는 기존 command port를 제공한다.
- ai-feedback module은 coaching prompt, provider 응답 검증, 완료 attempt 제한과 기록, module-local provider adapter와 HTTP interface를 소유한다. API composition은 learning의 저장 답안 문맥·진행 전이와 ai-feedback application port를 연결하며 어느 쪽도 상대 table을 읽지 않는다.
- learning module은 코스·레슨 조회 projection, 학습 진행·답안·채점·활동일 정책, 학습 schema·repository와 학습자 HTTP interface를 함께 소유한다. content의 published curriculum query, identity의 상태 query와 ai-feedback application port는 API composition에서 주입하며 다른 module table을 직접 읽지 않는다.
- resource-library module은 자료 tree·Markdown version·FTS·휴지통과 이미지 metadata lifecycle을 함께 소유한다. API composition은 관리자 actor directory와 object storage를 주입하고, SQLite와 object storage의 비원자적 변경은 보상 삭제·삭제 대기·reconciliation으로 격리한다.
- operations module은 대시보드·분석 조합, 운영 설정, 관리자 AI 대화·quota·변경안 검토와 관리자 HTTP interface를 소유한다. reporting은 identity·content·learning의 공개 port를 병렬 호출하고 하나라도 실패하면 불완전한 수치를 성공으로 공개하지 않는다. AI 변경안 승인은 API composition이 주입한 content·resource-library의 기존 command port만 호출한다.
- 외부 provider SDK, logger와 DB runtime 구현은 각각의 infra package에 격리하고 검증된 설정을 명시적으로 주입한다. HTTP framework의 공통 app·middleware·error·security 구현은 http-platform infra가 소유하되, endpoint를 소유하는 module interface는 공개 platform helper와 필요한 Hono route type을 사용한다. API composition은 module route와 실행 경계 route를 최종 app에 등록한다.
- 각 module과 auth infra는 자기 최종 Drizzle schema를 소유하고, 실제 seed가 있는 경계만 seed provider를 공개한다. API SQL이 유일한 migration 계보를 소유하고 schema·seed 실행을 조립한다.
- 공유 UI는 화면별 데이터 조회, 라우팅, 인증과 도메인 상태 전이를 소유하지 않는다.
- 각 runtime은 자기 설정을 명시적으로 파싱하고, 환경 변수 원문을 도메인 경계 너머로 전달하지 않는다.
- API 실행 진입점은 검증된 설정, Clock·ID, logger, DB, 외부 I/O와 여섯 module을 하나의 container에서 조립한다. learner·admin HTTP app은 이 container만 소비하며 module 내부 source나 persistence를 직접 알지 않는다.
- API 종료는 신규 요청 차단과 진행 응답 drain 뒤 `container.dispose()`에 resource 정리를 위임한다. container는 AI, DB, logger를 역순으로 정리하고 각 실패를 격리하며 signal 중복 수신은 같은 종료 작업으로 수렴시킨다.

## 의존성 판단

새 의존성이나 책임을 추가할 때는 다음을 확인한다.

1. 사용자 가치나 운영 요구가 아닌 현재 구현의 편의만을 위해 새 경계를 만들지 않는다.
2. 한 방향의 data flow와 오류 변환 책임을 명시할 수 없다면 경계를 추가하지 않는다.
3. 공유 후보는 둘 이상의 독립 consumer와 독립적인 변경 수명을 입증할 때만 package로 분리한다.
4. 외부 I/O, secret, process lifecycle은 가장자리 runtime에 격리한다.
5. 현재 source 위치와 import graph는 repository tooling으로 확인하고, 이 문서에서 목록으로 복제하지 않는다.

## 변경 탐색

| 질문                        | 먼저 확인할 권위 소스                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 현재 workspace·package 책임 | root와 workspace `package.json`, source import graph                                                                   |
| 현재 API·schema             | route registry, `packages/shared/contracts`, runtime OpenAPI                                                           |
| 현재 persistence·migration  | module schema·repository, `packages/infra/auth`, `apps/api/src/db`, `apps/api/drizzle`과 `packages/infra/db` primitive |
| 현재 배포 topology          | `deploy/compose/`, proxy 설정, release workflow                                                                        |
| 설계 이유                   | 관련 ADR와 이 문서의 경계 원칙                                                                                         |

## 독립성과 실패 격리

- 화면의 개별 장애는 다른 사용자 흐름의 정상 처리까지 중단시키지 않아야 한다.
- 공통 backend 경계의 장애 영향은 인증·인가 분리, health, timeout, 관찰과 복구 절차로 완화한다.
- 자동 복구가 데이터 손실을 키울 수 있는 경우 코드 복구와 데이터 복구를 분리하고 사람의 승인을 요구한다.
- 현재 구현이 이 원칙을 만족하는지의 판정은 문서 서술이 아니라 테스트와 운영 검증 보고서로 한다.
