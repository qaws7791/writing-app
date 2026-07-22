# P7 구현 증거

## 경계와 소유권

| 구분                                | P7 이후 소유자                                  | 협력 경계                                                    |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| 학습 진행·답안·채점·활동일          | `@workspace/learning` domain·application        | Clock과 branded ID를 사용하고 HTTP·Drizzle을 import하지 않음 |
| course·lesson·progress 조회         | learning query·projection·persistence           | content의 published curriculum query를 주입받음              |
| 학습 table·migration·repository     | learning infrastructure                         | 다른 module table을 join하거나 cross-module FK를 만들지 않음 |
| 학습자 HTTP와 canonical wire schema | learning HTTP·`@workspace/contracts/learning/*` | presenter와 contract mapper에서만 직렬화함                   |
| 사용자·AI 협력                      | identity query·ai-feedback application port     | API composition이 공개 port만 연결함                         |

기존 core learning 공개 표면, API의 learning read/transition adapter와 course·lesson·progress·transition 중복 route, DB infra의 learning schema를 제거했다. learning 자체 seed는 없으며 콘텐츠 seed는 계속 content가 소유한다. Web adapter의 canonical path는 유지했으므로 consumer 코드를 이중화하지 않고 새 module route로 교체했다.

identity에는 command authorization에 필요한 상태 query만 요청한다. 전체 제품 profile은 identity가 계속 소유하고, profile 화면에 필요한 학습 통계는 반대 방향의 좁은 learning profile-stats query로 제공한다. 사용하지 않는 전체 profile port를 learning에 추가하지 않은 것은 YAGNI와 개인정보 최소 전달을 우선한 결정이다.

## 검증된 구현

- start, answer, complete와 AI feedback 전이를 분리하고 accepted aggregate 전이는 frozen `DomainDecision`을 반환한다. 오답은 answer rejection, 예상 가능한 실패는 not-found·conflict·invalid-transition union으로 유지한다.
- `Asia/Seoul` 활동일은 주입된 Clock의 시각으로 계산한다. domain source에는 직접 시간·UUID 생성이 없고 경계 시각, 오답, 중복 완료, conflict와 완료 event payload를 회귀 검증한다.
- transition transaction은 learning table만 변경한다. `learning.lesson-completed` intent는 commit 결과에서 application으로 반환되고 발행·관찰 실패는 이미 commit된 성공 결과를 바꾸지 않는다.
- cursor 서명·keyset 조건·정렬과 persisted curriculum JSON mapping은 module persistence가 소유한다. 손상된 JSON은 부분 결과로 숨기지 않고 실패한다.
- schema 전환은 기존 row와 index를 보존하면서 content·identity 방향 FK를 제거하고 course progress를 부모로 하는 module 내부 FK만 유지한다. 같은 migration은 재실행 가능하다.
- module 조립은 repository, command, read query, HTTP route와 reporting query를 한곳에서 제공한다. API composition은 content, identity와 ai-feedback의 공개 port만 주입한다.

## 자동 검증

권위 도구인 Bun 1.3.10과 Node.js 24.x에서 확인한 결과다.

| 검증                   | 결과                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| learning module        | domain·application·persistence·HTTP 18 files·106 tests 통과       |
| API·OpenAPI            | 36 files·165 tests, module registry와 runtime OpenAPI parity 통과 |
| 전체 회귀              | root test 21 tasks, typecheck 26 tasks 통과                       |
| architecture·interface | 27-workspace graph, package interface와 dead-code gate 통과       |
| production build       | CI 공개 origin을 사용한 Web·Admin·Storybook 3 tasks 통과          |
| 정적 품질              | root lint와 Oxfmt 대상 파일 정리 통과                             |
| 핵심 learner E2E       | test auth로 오답→정답→AI 코칭→레슨·코스 완료 1 scenario 통과      |

## 선택과 trade-off

- cross-module FK 제거는 module 독립성과 migration 순서를 개선하지만 DB가 사용자·콘텐츠 참조 무결성을 대신 보장하지 않는다. 현재는 branded ID, content·identity query와 migration 사전 검사가 방어선이며 장기적으로 운영 무결성 감사 필요성을 관측해야 한다.
- identity 조립이 learning module 전체보다 먼저 필요해 reporting factory와 schema migration을 API composition에서 먼저 실행하고 module 조립 시 idempotent하게 재확인한다. 단기적으로 순환 의존 없이 안전하지만 조립 중복이 있으므로 P10·P11의 통합 composition/migration 단계에서 단일 실행 지점으로 수렴해야 한다.
- archived 여부를 판단하는 content port adapter는 curriculum 조회와 published 목록 조회를 조합한다. 경계를 넓히지 않는 대신 추가 조회가 생기므로 실제 지연이 문제가 되면 content 공개 query 결과에 상태를 포함하는 호환 변경을 검토한다.
- 완료 event는 commit 이후 process-local bus로 전달되므로 commit 지연과 실패 전파는 줄지만 process crash와 다중 instance 전달을 보장하지 않는다. durable outbox 도입 여부는 P13의 신뢰성·운영 근거로 판단한다.

## 추론과 제한

전체 계약·회귀 test, production build와 격리 E2E를 근거로 기존 핵심 학습 흐름이 유지됐다는 결론은 강한 추론이지만 production traffic 검증은 아니다. 운영 DB migration, 실제 OpenAI 호출, 부하·지연, process crash 직후 event 전달과 다중 API instance 경쟁은 수행하지 않았으므로 검증된 사실로 간주하지 않는다.
