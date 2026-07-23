# P5 구현 증거

## 경계 inventory

| 구분                                                      | P5의 권위 소유자                                                 | 소비·후속 전환                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| draft·published·보관·정규화 정책                          | `@workspace/content` domain·application                          | AI 변경 command는 P6, learning query는 P7, reporting query는 P9에서 주입       |
| 관리자 course·editor·publish·archive·reset HTTP           | content module HTTP interface와 `@workspace/contracts/content/*` | 기존 URL·method·wire 계약을 유지한 채 API composition이 identity actor를 주입  |
| course·curriculum·unit·lesson·step schema, trigger와 seed | `@workspace/content/schema`, `@workspace/content/seed`           | 통합 migration 계보와 물리 cross-module FK 제거는 P11                          |
| DB connection·transaction·legacy migration primitive      | `@workspace/db`                                                  | 정규화 정책은 API가 content 공개 경계에서 주입하며 DB는 module에 의존하지 않음 |

기존 core content, DB content policy·schema·seed, API content repository와 중복 route source는 제거했다. 아직 전환 전인 AI feedback, learning, dashboard·analytics repository의 content schema 읽기는 파일 단위 예외로 고정했고 각각 P6, P7, P9에서 공개 port로 치환한다. 학습자 HTTP route는 learning 소유이므로 P5에서 이동하지 않고 전체 API 회귀로 동작을 고정했다.

## 검증된 구현

- content는 `domain/application/infrastructure/interface` 수직 구조, private alias와 명시적 subpath를 갖는다. course, mutable draft와 immutable published revision, version 범위 hierarchy·stable reference, owner mutation, 보관과 reset 실패를 branded ID·immutable 값·`Result` union으로 표현한다.
- course당 draft 하나는 domain 선택과 SQLite partial unique index가 함께 보장한다. 발행은 기존 draft, course published reference와 다음 draft를 한 transaction에서 변경하며 실패 시 전체 rollback한다. event는 commit 뒤 발행하고 실패를 구조화 observer로 전달하므로 이미 확정된 콘텐츠를 되돌리지 않는다.
- published revision과 하위 계층의 변경 거부 trigger는 module schema migration이 idempotent하게 설치한다. 적용됐을 수 있는 baseline SQL은 이력 보존을 위해 재작성하지 않았고, orphan·중복 draft 사전 검사는 향후 FK 제거를 fail-closed한다.
- 보관은 신규 조회만 숨기고 명시적으로 고정된 published revision과 학습 기록을 보존한다. seed와 reset은 published revision·학습자 고정을 유지하면서 draft를 교체하고, reset은 owner authorization과 non-production destructive guard를 모두 요구한다.
- application은 7개 단일 use case와 learning·operations query, AI 변경 command port를 공개한다. HTTP interface는 parse, actor 확인, use case 호출, ETag와 exhaustive 오류 변환만 소유한다.
- API composition은 identity session을 content actor로 변환하고 content module을 주입한다. 관리자 7개 operation과 학습자 기존 route의 path·method·응답은 target contract와 전체 API 회귀에서 유지됐다.

## 자동 검증

권위 도구인 Bun 1.3.10과 Node.js 24.x로 다음 결과를 확인했다.

| 검증                   | 결과                                                                            |
| ---------------------- | ------------------------------------------------------------------------------- |
| install                | 919 installs·1158 packages, lockfile 갱신 후 dependency 변경 없음               |
| content test           | domain·application·repository·schema migration·seed·HTTP 7 files·39 tests 통과  |
| DB·API 회귀            | DB 5 files·28 tests, API 49 files·247 tests 통과                                |
| root test              | loopback 허용 환경에서 19 workspace tasks 통과                                  |
| root typecheck         | 순환 package dependency 없이 24 tasks 통과                                      |
| architecture·interface | 25-workspace graph, dead-code와 package interface 검사 통과                     |
| root build             | 공개 검증 origin으로 Web·Admin Turbopack과 Storybook 3 tasks 통과               |
| root lint·format       | architecture, dead-code, document drift, package interface, Oxlint와 Oxfmt 통과 |

샌드박스에서는 Bun의 `port: 0` bind가 `EADDRINUSE`로 거부됐지만 같은 Bun 1.3.10의 loopback 허용 환경에서 수명주기 2 tests와 API·root 전체 test가 통과했다. Storybook build의 vendor `use client`, circular chunk와 기존 chunk-size warning은 종료 코드를 실패시키지 않았으며 P5 source에서 생긴 warning은 아니다.

## 선택과 trade-off

- 기존 URL과 wire 계약 보존은 배포 호환성과 rollback 안전성을 높이는 대신, `/settings/content-reset`처럼 URL 분류와 소유 module 이름이 다른 흔적을 남긴다. route 소유권은 content로 단일화하고 외부 경로 변경은 P12 consumer 전환 전까지 미뤘다.
- module이 schema·trigger의 현재 정의를 소유하되 baseline migration을 수정하지 않았다. 단기에는 같은 trigger 의미가 현재 schema와 역사 SQL에 함께 보이지만, 적용 이력 파괴보다 안전하다. P11에서 append-only migration과 통합 runner로 이 중간 상태를 제거한다.
- 아직 전환되지 않은 consumer의 직접 schema 읽기를 한꺼번에 바꾸면 P6·P7·P9의 transaction과 오류 계약까지 동시에 흔든다. 정확한 파일 예외와 제거 단계는 단기 결합을 명시적으로 드러내며, 장기적으로는 공개 query·command port만 남긴다.
- operations reporting은 현재 published curriculum을 메모리에서 결합한다. 구현과 실패 경계가 단순한 대신 데이터 규모가 커지면 I/O와 메모리 비용이 증가하므로, 측정된 병목이 생길 때 module-owned read model이나 batch query로 전환한다.
- process-local event는 빠르고 단순하지만 재시작·다중 instance·재전달을 보장하지 않는다. 권위 상태는 transaction에 남겼으며 durable 후속 처리가 필요해지면 outbox와 replay를 함께 설계해야 한다.

## 추론과 제한

전체 계약·회귀 test와 production build를 근거로 기존 사용자 동작이 유지됐다는 결론은 강한 추론이지만 production traffic 검증은 아니다. 실제 운영 DB의 P11 migration, 외부 OAuth·AI provider, 부하·지연 benchmark와 다중 API instance event 전달은 수행하지 않았으므로 검증된 사실로 간주하지 않는다.
