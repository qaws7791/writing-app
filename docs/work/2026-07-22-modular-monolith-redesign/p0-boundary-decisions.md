# P0 bounded context와 위험 결정

## 책임 배정

| context          | 현재 source 후보                                                          | 목표 책임                                            |
| ---------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| identity         | core auth/admin 일부, API auth·identity adapter와 user route              | profile, 상태, role·owner, 비식별화                  |
| content          | core content, API admin-content와 content adapter                         | draft, immutable published revision, publish·archive |
| ai-feedback      | core ai-feedback, API feedback adapter·provider                           | prompt, 응답 검증, attempt 정책과 기록               |
| learning         | core learning, learner course·lesson·progress·transition route와 adapter  | 탐색, 진행, 답안, 상태, 활동일                       |
| resource-library | core resource-library, API resource route·adapter                         | tree, 문서, 검색, 휴지통, asset metadata             |
| operations       | core admin의 dashboard·analytics·settings·AI chat, 대응 API route·adapter | reporting 조립, 설정, 관리자 AI 대화·승인            |
| 공통 platform    | API app·middleware·OpenAPI·health·lifecycle, auth infra                   | HTTP 보안·관측·조립과 credential/session lifecycle   |

[Route·data inventory](./p0-route-and-data-inventory.md)의 route, table·trigger와 contract subpath를 이 배정에 연결했으며 중복 또는 미배정 항목은 0개다. 현재 flat source 이름에서 목표 책임을 도출한 부분은 목표 가이드와 route·schema를 대조해 확정한 전환 결정이며, 아직 package 이동이 끝났다는 사실은 아니다.

## Contract, ID와 module 협력

- canonical wire contract는 `contracts/{identity,content,ai-feedback,learning,resource-library,operations}` context subpath가 각각 하나만 소유한다. auth cookie는 auth contract, 공통 오류는 shared errors가 소유한다.
- transport-neutral brand로 옮길 ID는 learner/user, admin, course, curriculum version, unit, lesson, step, resource node/document/asset와 AI conversation/message ID다.
- 즉시 query port는 learning→content published content, learning→identity 상태, operations→identity·content·learning reporting이다.
- 필수 동기 application port는 learning→ai-feedback 요청과 관리자 승인 뒤 operations→content/resource command다. credential·role 변경의 session 폐기도 동기 port다.
- commit 이후 비핵심 analytics·audit·activity notification은 domain event 후보다.
- 반드시 전달·재생해야 하는 projection, credential/session 폐기와 R2 보상·reconciliation은 in-memory event만으로 처리하지 않는다.

현재 operations가 직접 읽는 cross-context source는 dashboard·analytics adapter이고, identity 사용자 조회도 content·learning table을 직접 읽는다. 이 목록은 P4·P7·P9의 query/reporting port 제거 기준선이다.

## 순수성 기준선

현재 production application source에서 직접 시간·ID를 만드는 확인된 예외는 `packages/core/src/modules/ai-feedback/application/use-cases/ai-feedback-attempt-coordinator.ts`의 `new Date()`와 `crypto.randomUUID()`다. learning application의 Node crypto 사용도 runtime adapter로 이동할 후보이며, domain의 입력 Date 변환은 외부 시간 조회가 아니다. framework·ORM·provider SDK, `process.env` 직접 import는 core domain에 없다.

frontend의 module·DB·Drizzle import와 Storybook의 UI·config 외 package import는 금지 대상으로 확정했고 현재 dependency-cruiser 위반은 0개다.

## 데이터와 외부 I/O 결정

- 기존 migration은 checksum과 적용 이력을 보존하고 새 migration만 append한다. package 재편은 reversible하므로 별도 ADR 없이 진행하지만 modular-monolith 장기 경계와 P11 migration 계보 변경은 ADR 대상이다.
- cross-module FK 제거 전 orphan, duplicate ID, revision 범위와 `foreign_key_check`를 검사한다. 제거 후 module별 repository reconciliation과 integration test가 같은 불변식을 검사한다.
- SQLite write transaction은 짧게 유지하고 OpenAI·R2·network I/O를 transaction 밖에서 수행한다. 단일 writer contention은 busy timeout, 멱등 key와 재시도로 격리한다.
- in-memory event bus는 권위 projection을 만들지 않는다. outbox, worker, Redis와 generic queue는 이번 범위에 추가하지 않는다. durable delivery 요구가 확인되면 별도 승인과 ADR로 확장한다.

## 호환성과 중단 조건

source 이동, 내부 adapter 교체와 응답 의미를 바꾸지 않는 additive optional field는 허용할 수 있다. route method/path, auth audience, 기존 required field, 공개 error code·status, cookie 의미, published data와 migration 이력의 파괴 변경은 금지한다.

다음 조건에서는 다음 단계로 진행하지 않고 직전 commit 경계로 되돌린다.

- route/OpenAPI 또는 frontend adapter parity가 달라짐
- table·trigger owner, cross-context FK/join 또는 contract owner가 미배정됨
- migration integrity·foreign key, backup·restore smoke 실패
- architecture, public surface, frozen install, test, lint, typecheck 또는 build 회귀
- production target이나 외부 자원 변경이 필요하지만 별도 승인이 없음

따라서 P0 종료 시 미배정 책임, 미분류 cross-context 접근과 확보하지 못한 기준선은 0개다. 알려진 local Bun 1.3.14·Lexical 호환 문제는 고정 Bun 1.3.10 성공 결과와 분리해 [P0 검증](./p0-validation.md)에 남긴다.
