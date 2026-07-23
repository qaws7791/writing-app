# P9 구현 증거

## 경계와 소유권

| 구분                           | P9 이후 소유자                                               | 협력 경계와 consumer                                                                                            |
| ------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 대시보드·분석                  | `@workspace/operations` reporting application·HTTP           | identity·content·learning의 공개 reporting port를 API composition이 주입하고 Admin 화면이 기존 HTTP 경로를 소비 |
| 공지·법적 문서 설정            | operations domain·application·persistence·HTTP               | identity가 판정한 owner mutation capability만 전달하고 Admin 설정 화면이 소비                                   |
| 관리자 AI 대화·streaming·quota | operations application·persistence·AI adapter·HTTP           | resource-library knowledge query와 AI infra runtime을 port 뒤에서 소비                                          |
| AI 변경안·검토                 | operations domain·application·persistence·canonical contract | 승인 시 content draft와 resource document의 기존 command port만 호출                                            |
| runtime 조립·감사              | API composition                                              | 인증 session, 세 reporting port, 두 변경 command, DB·AI 설정과 구조화 logger를 주입                             |

착수 inventory에서 기존 core admin use case·port, API의 dashboard·analytics·settings·AI route와 Drizzle adapter, DB infra의 admin settings·chat schema를 이전 대상으로 확정했다. 외부 consumer는 Admin의 대시보드·분석·설정·AI 화면이며 기존 dashboard, analytics, settings와 AI conversation·streaming method/path를 유지했다. 제품 문서에만 있던 AI 변경안 검토에는 조회·승인·거절 route와 canonical contract를 추가했다. 현재 route·table·제한값의 최종 권위는 module HTTP registry, schema와 quota guard다.

identity는 관리자 role과 owner policy를 계속 소유한다. API composition은 그 결정을 `settingsMutation` capability로 변환하며 operations는 identity package나 table을 import하지 않는다. 기존 core admin source, app-owned operations repository·route·agent, DB의 admin schema 재공개와 의미 없는 operations contract forwarding은 제거했다. package interface gate는 이 경로들의 재도입, 다른 비즈니스 module 직접 import와 cross-module FK를 거부한다.

## 검증된 구현

- settings, notice·legal document, AI conversation·message와 안전한 AI 변경안 entity를 module domain에 두었다. 변경안은 `proposed → applying → approved` 또는 `proposed → rejected`만 허용하고 compare-and-set repository로 중복 검토를 거절한다.
- AI 도구는 content draft와 resource document 변경안만 만들 수 있다. 발행, 영구 삭제, 권한과 운영 설정 변경 variant와 도구는 제공하지 않으며 실제 반영은 별도 관리자 승인 뒤 대상 module의 기존 command를 거친다.
- 관리자 일·분, IP 분 단위 counter는 SQLite transaction으로 소비하고 같은 관리자·대화의 in-flight 요청은 I/O 전에 process-local로 예약한다. quota 거절은 안정된 `AI_CHAT_RATE_LIMITED`와 `Retry-After`를 반환한다.
- expected failure는 permission, quota, provider, validation, conflict를 구분하며 not-found, reporting과 persistence 실패도 별도 variant로 유지한다.
- dashboard·analytics query는 identity·content·learning reporting port를 동시에 시작한다. 어느 하나라도 실패하면 실패 source를 구조화 관찰하고 불완전한 수치를 성공으로 합치지 않은 채 `OPERATIONS_REPORTING_UNAVAILABLE` 503을 반환한다.
- reporting 결과는 요청 시점에 세 snapshot을 join한다. 다른 module repository·schema를 읽거나 dashboard용 cross-module table·in-memory event projection을 만들지 않는다.
- settings query와 notice·legal command, AI conversation query·streaming·proposal review를 분리했다. provider 설정이 없으면 user message 저장 전에 canonical error SSE를 반환한다.
- AI 문맥 도구는 관리자 자료실의 활성 문서 검색·읽기뿐이다. Git, 저장소 코드, 프로젝트 문서와 파일 시스템 제외 지침을 agent에 고정하고 filesystem·shell 도구를 제공하지 않는다.
- operations schema가 settings, conversation, message, proposal과 quota counter를 소유한다. migration은 기존 chat row를 보존하면서 identity table 방향 FK를 제거하고 module 내부 FK만 남기며 재실행 가능하다.
- HTTP는 인증과 private no-store를 공통 적용하고 canonical `chunk`, `done`, `error` SSE만 쓴다. owner mutation, quota 거절과 제안 검토 결과를 security audit event로 남긴다.
- `module.ts`가 migration, repository, quota guard, reporting·settings·AI application, Mastra adapter와 route를 조립한다. API composition은 public facade와 port만 사용한다.

## 자동 검증

권위 도구인 Bun 1.3.10과 Node.js 24.x에서 최종 확인한 결과를 기록한다.

| 검증                       | 결과                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- |
| install                    | frozen lockfile로 926 installs·1,162 packages, 변경 없음                               |
| operations module          | domain·application·provider fake·temporary SQLite·HTTP 6 files·28 tests 통과           |
| API·계약·reporting         | API 25 files·133 tests, contract 13 files·62 tests, learning 18 files·106 tests 통과   |
| migration smoke            | 임시 SQLite에서 기존 row 보존, cross-module FK 제거와 멱등 재실행 통과                 |
| 전체 회귀                  | root test 22 tasks와 typecheck 27 tasks 통과                                           |
| architecture·interface     | 29-workspace graph·interface·dead-code와 22개 runtime coverage 집계 통과               |
| production build·정적 품질 | Web·Admin·Storybook 3 builds, root lint·Oxfmt 통과; pre-commit은 staged file 없이 종료 |
| 관리자 operations flow     | test auth E2E 3 scenarios에서 dashboard 진입, owner 설정 변경과 operator 403 회귀 통과 |

## 선택과 trade-off

- reporting을 요청마다 병렬 조합하고 부분 실패를 fail-closed했다. 잘못된 운영 지표를 노출하지 않고 장애 source를 격리하지만 한 module 장애가 세 운영 조회를 일시 중단한다. 실제 지연·가용성 근거가 생기면 source별 신선도를 명시한 materialized read model을 별도 설계해야 한다.
- cross-module FK와 SQL join을 제거해 module migration 결합을 낮췄다. 대신 관리자·content·resource 참조 무결성은 application authorization, 대상 command와 후속 reconciliation에 의존한다. P11에서 통합 migration과 dangling-reference 관찰을 완성해야 한다.
- quota counter는 영속화했지만 in-flight guard는 process-local이다. 현재 단일 API process에는 단순하고 빠르며, 다중 instance를 운영한다는 근거가 생기면 DB lease나 분산 원자 연산으로 교체해야 한다.
- AI 승인을 동기식 대상 command와 proposal CAS로 구현해 현재 도메인 규칙을 재사용했다. 별도 범용 workflow를 만들지 않아 유지보수 범위는 작지만 process가 `applying` 중 종료되면 자동 판정할 수 없으므로 장기적으로 idempotency key와 reconciliation이 필요하다.
- 기존 settings·chat table 이름과 row를 보존하면서 소유권만 module로 옮겼다. 배포 호환성은 높지만 migration 실행 지점이 module factory에 남아 있으며 P10·P11에서 lifecycle과 단일 migration 계보로 수렴해야 한다.

## 추론과 제한

source graph, 계약·통합 test, production build와 격리 E2E를 근거로 기존 관리자 operations 흐름이 유지됐다는 결론은 강한 추론이지만 production traffic 검증은 아니다. 실제 OpenAI 호출, 운영 DB upgrade, 다중 API instance quota 경쟁, 부하·지연, provider streaming 중 process crash와 `applying` 제안 복구는 수행하지 않았으므로 검증된 사실로 간주하지 않는다.
