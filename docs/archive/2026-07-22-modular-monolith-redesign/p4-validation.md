# P4 구현 증거

## 검증된 구현

- 구현 기준 commit은 `35198a05e185c5b530f157f98dd3fedc56fce3b3`이다. P4 변경은 credential·session을 auth infra에 남기고 profile·사용자 상태·관리자 role·owner 정책을 `@workspace/identity`로 이전했다.
- identity는 `domain/application/infrastructure/interface` 수직 구조, private alias와 explicit subpath를 갖는다. learner profile, `active | suspended | deleted` 전이, 비식별화, owner authorization, optimistic version conflict와 예상 가능한 실패를 immutable aggregate·decision·event와 `Result`로 표현한다. 삭제 상태의 profile 변경과 보호 API 접근은 거부하되, 제품 요구에 따라 owner 상태 변경으로 삭제 시각을 비우고 계정을 복구할 수 있다.
- application은 provisioning, profile query·command, 상태·role command, learner/operations query, learner identity directory와 auth session 폐기 port를 분리한다. auth·repository·clock·event port는 concrete vendor type을 노출하지 않는다. identity package는 `@workspace/auth`에 의존하지 않고 API auth adapter가 credential row를 vendor-neutral identity로 변환한다.
- identity schema는 learner profile과 admin role만 소유하고 Better Auth table을 재수출하지 않는다. 신규 DB baseline은 identity table을 만들지 않으며, migration은 기존 profile의 cross-module FK를 데이터 보존 방식으로 제거하고 version·비식별화를 적용한다. API가 전달한 neutral legacy role record는 identity row로 한 번 backfill한다. 임시 SQLite repository·transaction test가 migration idempotency, FK 제거, rollback과 conflict를 검증한다.
- learner profile/session과 관리자 사용자 route는 identity HTTP interface가 소유한다. 기존 path와 response를 유지하면서 비인증·정지·권한 거부·not found·conflict·의존성 실패를 공개 오류로 exhaustive mapping한다.
- API composition은 인증 hook에 provisioning port를 주입하고, auth identity를 identity session으로 변환하며, module route와 query를 조립한다. 기존 core auth·admin role, API profile/admin identity repository와 중복 route source는 제거했다.
- operations dashboard·analytics는 identity table을 직접 join하지 않고 reporting query를 주입받는다. learning은 공개 identity query를 사용하며 module 간 table 접근을 package interface와 dependency graph 검사로 거부한다.
- `identity.user-status-changed`는 commit 뒤 process-local event bus로 발행한다. 발행 실패는 이미 반영된 상태를 되돌리지 않고 구조화 경고 port로 관측하며, session 폐기 실패가 발생해도 commit된 상태 event를 누락하지 않는다.

## 자동 검증

권위 도구인 Bun 1.3.10과 Node.js 24.x로 다음 결과를 확인했다.

| 검증           | 결과                                                                                  |
| -------------- | ------------------------------------------------------------------------------------- |
| frozen install | 917 installs·1157 packages, lockfile 변경 없음                                        |
| root test      | 18 tasks, 202 files·880 tests 통과                                                    |
| identity test  | domain·application·repository·HTTP 6 files·26 tests 통과                              |
| auth·API 회귀  | auth 8 files·23 tests, API 51 files·251 tests 통과                                    |
| root typecheck | 23 tasks 통과                                                                         |
| root lint      | 24-workspace architecture, dead-code, package interface, document drift와 Oxlint 통과 |
| root build     | Web·Admin Turbopack production build와 Storybook 정적 build 3 tasks 통과              |

origin 입력이 없는 production build는 기존 fail-closed 계약대로 중단됐다. CI와 같은 비밀 없는 공개 origin을 주입한 Web·Admin webpack build를 먼저 격리 통과시켰다. sandbox 안에서는 Turbopack과 loopback lifecycle test가 진행되지 않았고 Node의 최소 bind도 `EPERM`을 반환했다. 같은 Bun 1.3.10·공개 origin으로 권한 경계를 분리해 재실행한 표준 root Turbopack build는 Web·Admin·Storybook 3 tasks 모두 종료 코드 0으로 완료됐다.

로컬 기본 Bun 1.3.14에서는 격리 runner의 Lexical 초기화 순서 문제가 재현됐다. `port: 0` 실패는 Bun 버전과 무관한 sandbox loopback 제한으로 최소 재현했고, 같은 API lifecycle과 전체 test는 loopback이 허용된 권위 Bun 1.3.10에서 통과했다. 실행기·권한 차이와 P4 회귀를 분리해 판정했다.

## 선택과 trade-off

- 기존 URL과 wire response를 유지해 단기 호환성과 rollout 안전성을 우선했다. 대신 contract가 bounded context 이름과 완전히 일치하지 않는 전환 비용은 남으며, P12 consumer 전환 때 불필요한 legacy 명칭을 별도로 판정해야 한다.
- process-local event는 구현과 장애 범위가 단순하지만 재시작·다중 instance·재전달을 보장하지 않는다. 상태 변경의 권위 데이터는 동기 transaction에 남겼고, durable 후속 처리가 필요해지면 transactional outbox와 replay를 함께 도입해야 한다.
- 상태·role 저장과 auth session row 폐기는 서로 다른 port 호출이라 원자적이지 않다. 현재 보호 요청은 매번 identity의 최신 상태·role을 다시 확인하므로 폐기 실패 중에도 권한은 fail-closed하며, 호출자는 503을 받는다. 반복 가능한 자동 복구가 필요해지면 idempotent revocation job이나 동일 database unit-of-work를 검토해야 한다.
- learner identity directory와 operations reporting port 뒤에서 현재 데이터를 메모리 결합·정렬·집계하는 방식은 auth schema와 module 간 SQL join을 즉시 제거하는 작은 변경이다. 사용자 규모가 커져 지연이나 메모리 압력이 측정되면 module-owned read model 또는 cursor/batch query 계약이 장기 대안이다.
- legacy credential role을 즉시 삭제하지 않고 identity row로 backfill해 rollback 가능성을 확보했다. 모든 배포가 새 role 권위 소스를 사용한다는 운영 증거가 생기기 전에는 물리 column 삭제를 별도 migration으로 수행하지 않는다.

## 추론과 제한

동일한 HTTP 계약과 전체 회귀 test를 근거로 사용자 동작이 유지됐다는 결론은 강한 추론이지만 production traffic 검증은 아니다. 실제 배포, 기존 운영 DB migration, 외부 OAuth, 부하·지연 benchmark와 다중 API instance의 event 전달은 수행하지 않았으므로 검증된 사실로 간주하지 않는다.
