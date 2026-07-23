# P11 구현 증거

## Schema composition과 불변식

| 경계             | schema owner                                                             | 통합·검증 책임                                                        |
| ---------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 인증             | auth infra                                                               | Better Auth mapping과 인증 rate-limit 상태                            |
| 제품 데이터      | identity·content·ai-feedback·learning·resource-library·operations module | 각 table·index·trigger와 module 내부 FK                               |
| application DB   | API DB composition                                                       | schema tooling entry, migration 계보와 seed 순서                      |
| SQLite primitive | DB infra                                                                 | connection, transaction, migration runner, backup과 destructive guard |

API의 단일 schema entry가 auth와 여섯 module의 공개 schema를 수집하고 Drizzle config는 이 파일만 입력으로 사용한다. DB infra의 schema re-export, application migration SQL과 seed는 제거했다. package interface 검사는 schema·migration·seed의 허용 consumer, DB infra의 business dependency 부재, 이전 DB 경로와 migration checksum을 함께 고정한다.

fresh와 upgrade fixture에서 모든 application table을 owner에 배정하고 snake_case·context naming을 검사했다. 물리 FK는 같은 owner 안에만 남겼다. learning aggregate, resource tree와 operations conversation 내부 FK는 DB가 즉시 거부하고, auth·identity·content 같은 다른 owner의 ID는 값으로 저장한다. 후자는 SQL join 없이 owner별 ID set을 읽는 reconciliation query가 dangling reference를 보고한다. DB 내부 FK 위반과 application-level orphan을 별도 fixture로 만들어 두 책임이 섞이지 않는 것도 확인했다.

운영 관리자 인증 감사의 identity 조회는 auth와 identity를 별도 query한 뒤 application에서 합성하도록 바꿨다. runtime persistence의 다른 module table join은 정적 검색과 package interface 검사에서 허용하지 않으며, migration·test·seed tooling의 데이터 검증 SQL은 runtime 경계에서 제외한다.

## Migration 계보와 호환성

기존 baseline을 API migration directory의 첫 순서로 옮기고 schema 소유권 변경을 다음 append-only SQL로 추가했다. 이동 전 baseline은 혼합 line ending을 포함했기 때문에 raw byte hash가 아니라 LF로 정규화한 SQL을 비교했다. 과거 source와 현재 baseline의 정규화 SHA-256은 `ca744dd3c34bdd604cfd3de4e57c44dc4299e67bb6685926e4d89aa5821bee25`로 같으며, raw byte 동일성은 주장하지 않는다. 새 migration의 정규화 SHA-256은 `20b1b8a424d4916b565f5b991f221ddc0708a1a654f0cfbeaf6627b53b2636b0`이다.

append-only SQL을 다음 관점에서 직접 검토했다.

- auth rate-limit table 생성과 identity role backfill이 credential role 제거보다 먼저 실행된다.
- identity, learning, AI feedback, resource-library와 operations table 재구성은 명시적인 column 목록으로 row를 복사하고 복사 뒤에만 legacy table을 제거한다.
- learning aggregate, resource tree와 operations conversation의 module 내부 FK·cascade만 다시 만들고 auth·content·identity를 향한 FK는 만들지 않는다.
- 기존 index와 resource trigger를 새 table에 다시 만들며, asset lifecycle column의 legacy backfill 값이 최종 CHECK를 만족한다.
- 모든 SQL, 최종 schema 검증과 migration 이력 row가 같은 transaction에 있고 FK 재활성화 전에 `foreign_key_check`를 통과한다.

자동 fixture는 빈 DB 전체 적용과 반복 실행, baseline incremental upgrade, P10 module schema 채택, 알려진 관리자 MFA와 ancient curriculum 이관을 다룬다. baseline upgrade는 핵심 table row count와 identity role·resource asset backfill을 비교하고 fresh DB와 전체 `sqlite_master` snapshot이 같은지 확인한다. legacy curriculum 정규화나 AI attempt 준비가 실패하면 같은 transaction에서 원상 복구된다.

지원하지 않는 부분 schema, orphan·중복 draft·invalid module state와 알 수 없는 migration/checksum은 변경 전 또는 transaction 안에서 fail-closed한다. 새 코드는 위에서 식별한 이전 schema를 올릴 수 있지만, 새 schema는 credential role column을 제거하므로 이전 API image 전체와의 역호환을 보장하지 않는다. 이전 module migration 함수의 멱등성은 검증했으나 이는 code-only rollback 근거가 아니다. 이전 image가 필요하면 writer를 중지하고 migration 전 검증 백업을 복구해야 한다.

## Seed·reset·backup·restore

실제 seed가 있는 content와 identity module만 `./seed`를 공개하며 auth infra는 인증 seed를 별도로 제공한다. API seed composition은 migration, auth, content, identity 순서를 명시한다. 같은 DB에 seed를 다시 실행한 뒤에도 기존 learner course progress가 남는 회귀 test로 seed와 reset을 분리했다.

reset은 모든 환경에서 `ALLOW_DATABASE_RESET=true`와 `--force`가 함께 필요하다. production에서는 계산된 target fingerprint까지 일치해야 하며 누락·불일치 fixture가 파일 삭제 전에 실패한다. 삭제 전 DB·WAL·SHM은 저장소 data 하위의 별도 backup directory로 복사하고 크기를 검증한다.

현재 schema와 seed를 적용한 file-backed DB에서 WAL을 포함한 snapshot을 만들고 `DELETE` journal mode의 단일 백업 파일로 정규화했다. generic 검증은 integrity와 필수 table read를 임시 복구본에서 확인하고, API 통합 test는 migration 이력과 모든 current-schema table을 요구한 뒤 별도 read-only connection에서 실제 content module query를 실행한다. 백업 중 source DB와 WAL 바이트가 유지되고 SHM의 존재·크기가 유지되는지, 최종 백업이 바뀌거나 옆에 sidecar가 생기지 않는지도 회귀 검증한다.

migration 사전 검사·transaction·최종 schema 검증이 실패하면 API 기동을 중단한다. 백업 생성이나 검증이 실패하면 migration·배포를 진행하지 않고, 복구 후보 검증이 실패하면 writer를 전환하지 않는다. code rollback과 data recovery는 별도 승인 작업이며 구체 절차는 영구 migration·backup·rollback 문서에 반영했다.

## 자동 검증

권위 도구인 Bun 1.3.10과 Node.js 24.x에서 다음 범위를 실행한다.

| 검증                                    | 결과                                                             |
| --------------------------------------- | ---------------------------------------------------------------- |
| frozen dependency 설치                  | `bun install --frozen-lockfile` 통과                             |
| architecture·dead-code·interface        | 29-workspace graph, Knip과 package interface 검사 통과           |
| P11 migration·seed·reset·backup fixture | API 29 files·152 tests와 DB 4 files·20 tests 안에서 통과         |
| 전체 typecheck                          | 27/27 tasks 통과                                                 |
| 전체 test                               | 22/22 tasks 통과                                                 |
| production build·lint·Oxfmt             | API·Web·Admin·Storybook 4/4 builds와 root lint·format check 통과 |
| pre-commit                              | 정상 종료, staged file이 없어 개별 hook은 skip                   |

production build에는 quality-gates workflow와 같은 비밀 아닌 example origin을 사용했고 설정 parser를 완화하지 않았다. Storybook의 기존 vendor directive·chunk warning은 종료 코드를 실패시키지 않았다. pre-commit 범위보다 넓은 root lint와 Oxfmt를 별도로 실행했으며 사용자 변경을 임의로 stage하지 않았다.

## 선택과 trade-off

- 통합 계보를 API에 두어 실행 순서와 실패 지점은 단순해졌지만, schema 변경은 module schema와 API migration을 함께 검토해야 한다. 현재 단일 API·SQLite 배포 단위에는 일치하며 module별 DB 독립 확장을 목표로 하지는 않는다.
- cross-module FK 제거는 module 자율성과 migration 격리를 높이지만 참조 무결성을 모든 write path와 reconciliation이 함께 책임져야 한다. DB 내부 aggregate invariant는 계속 FK·CHECK·index·trigger로 보장해 application 검증 범위를 최소화했다.
- 기존 baseline을 squash하지 않아 upgrade 근거를 보존했지만 fresh DB도 두 단계를 실행한다. 기동 시 한 번 드는 비용보다 배포 이력의 신뢰성과 복구 가능성을 우선했다.
- backup을 단일 DELETE-journal 파일로 정규화해 독립 복구는 단순해지지만 snapshot 생성 뒤 짧은 추가 쓰기 연결이 필요하다. 이 연결은 임시 백업에만 열리고 원본 DB에는 쓰지 않는다.

## 추론과 제한

source graph, checksum, 임시 SQLite fixture와 application read를 근거로 저장소가 정의한 known schema의 migration·seed·backup 경계가 보존됐다는 결론은 강한 추론이다. production DB의 실제 변형, 데이터 규모별 migration lock 시간, 실제 배포 image의 양방향 호환, 운영 backup storage와 복구 전환은 실행하지 않았다. 따라서 production migration·restore 성공이나 운영 중단 시간이 검증됐다고 주장하지 않는다.
