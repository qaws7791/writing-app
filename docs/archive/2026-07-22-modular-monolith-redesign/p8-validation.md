# P8 구현 증거

## 경계와 소유권

| 구분                                    | P8 이후 소유자                                                    | 협력 경계                                                                         |
| --------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| tree·문서·검색·휴지통·자산 정책         | `@workspace/resource-library` domain·application                  | Clock, branded ID, actor directory, Markdown codec와 object storage를 port로 사용 |
| resource table·FTS·repository·migration | resource-library infrastructure                                   | node·document·asset 내부 FK만 유지하고 identity ID는 참조 값으로 저장             |
| 관리자 자료실 HTTP                      | resource-library HTTP와 `@workspace/contracts/resource-library/*` | 기존 14개 method·path와 canonical DTO·오류 계약 유지                              |
| 관리자 actor·R2 구현·runtime 조립       | API composition                                                   | 검증된 설정과 infra adapter를 module port에 주입                                  |
| 관리자 AI 소비                          | resource-library 공개 command·knowledge query                     | 기존 문서 저장 command만 변경하고 활성 문서만 조회                                |

착수 inventory에서 core의 domain·use case, API의 관리자 route·Drizzle repository, `resource-assets` runtime과 DB infra schema를 이전 대상으로 확정했다. 공유 Markdown codec은 `@workspace/resource-document` 소유를 유지하고 resource-library application port 뒤에서 소비한다. 외부 consumer는 Admin의 기존 14개 HTTP operation과 관리자 AI의 자료 검색·문서 조회이며, table은 node·document·asset과 FTS로 한정했다.

기존 core resource-library, API 소유 repository·route·asset runtime과 DB infra resource schema는 제거했다. package interface 검사는 제거 경로 재도입, module 간 직접 의존, infra DB의 schema 재공개, command port의 확대와 private alias 우회를 거부한다.

## 검증된 구현

- domain은 폴더·문서·자산과 active·trashed·delete-pending 상태를 구분한다. 같은 부모 이름, 부모 종류, 최대 1,000개·3단계, 순환 이동, 결정적 정렬과 연결된 하위 트리 trash·restore를 검사한다.
- 문서는 Markdown만 저장하고 강한 정수 ETag와 `If-Match` version을 사용한다. stale 저장은 로컬 요청을 쓰지 않고 최신 문서와 ETag를 `412`로 돌려준다.
- 이미지 upload는 실제 byte signature, 5 MiB, JPEG·PNG·WebP와 필수 대체 텍스트를 HTTP와 domain에서 각각 검증한다. object key는 문서·자산 ID와 감지 MIME으로 결정한다.
- upload는 검증→object 저장→metadata 저장 순서이며 DB 실패 시 같은 key를 보상 삭제한다. DB와 보상 삭제가 함께 실패하면 식별 가능한 orphan 감사 event를 구조화 logger로 전달한다.
- 영구 삭제는 SQLite에서 자산을 delete-pending으로 먼저 확정하고 object 삭제 성공 뒤 metadata와 tree를 완료 삭제한다. 실패 상태는 영속적으로 남고 reconciliation의 읽기 전용 dry-run과 mutation command가 별도 공개된다.
- migration은 기존 row·FTS를 보존하면서 identity 방향 FK를 제거하고 module 내부 FK·index·trigger와 자산 lifecycle 열을 만든다. partial schema, 잘못된 node·actor·document·asset 참조와 FK 위반은 변경 전에 거절하며 재실행 가능하다.
- 모든 자료실 route는 관리자 session authorization과 private no-store를 공유한다. storage·보상 실패는 서로 다른 canonical `503` 오류로, not-found·validation·conflict는 명시적 상태로 변환한다.
- 필수 관리자 E2E에서 드러난 기존 content `CONTENT_CONFLICT` 소비 누락은 `stale-revision` 매핑과 회귀 test로 보완했다. 이는 P8 경계 변경이 만든 회귀가 아니라 자료실 흐름에 도달하기 전 존재하던 호환 결함이다.

## 자동 검증

권위 도구인 Bun 1.3.10과 Node.js 24.x에서 확인한 결과다.

| 검증                    | 결과                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| install                 | 925 installs·1,161 packages, frozen lockfile 변경 없음                                    |
| resource-library module | domain·application·repository·migration·HTTP 11 files·40 tests 통과                       |
| API·계약                | API 35 files·163 tests, 14개 operation·OpenAPI parity와 storage adapter 통과              |
| migration smoke         | 격리된 임시 SQLite에서 전체 migration 최초 실행·멱등 재실행 통과                          |
| 전체 회귀               | root test 22 tasks, typecheck 27 tasks 통과                                               |
| architecture·interface  | 28-workspace graph, package interface, dead-code와 route bundle gate 통과                 |
| production build        | CI 공개 origin을 사용한 Web·Admin·Storybook 3 tasks 통과                                  |
| 정적 품질               | root lint, Oxfmt와 pre-commit gate 통과                                                   |
| 관리자 E2E              | test auth로 폴더·문서 생성, Markdown 가져오기·저장·재조회·내보내기와 권한 1 scenario 통과 |

환경값 없는 production build는 기존 정책대로 `production web origin is required`에서 fail-fast했다. 성공 build에는 CI와 같은 비밀 아닌 example origin만 사용했다. Storybook의 기존 vendor directive·chunk warning은 종료 코드를 실패시키지 않았다.

## 선택과 trade-off

- SQLite와 object storage는 하나의 transaction을 공유할 수 없다. 짧은 DB transaction과 보상·delete-pending·reconciliation을 선택해 lock 시간과 장애 전파를 줄였지만, 운영자는 pending과 orphan 감사 event를 관측하고 재처리해야 한다.
- identity FK와 persistence join을 제거해 module 배포·migration 결합을 낮췄다. 대신 actor 참조 무결성은 migration 사전 검사와 actor directory에 의존하므로 장기적으로 운영 데이터에서 dangling ID가 관측되면 P11의 reconciliation query를 강화해야 한다.
- 관리자 AI에는 전체 application facade 대신 기존 문서 command와 읽기 전용 knowledge query만 공개했다. 확장 편의성은 낮지만 권한 없는 tree·asset 변경과 휴지통 문서 노출을 구조적으로 제한한다.
- orphan을 위해 범용 queue·outbox를 추가하지 않고 구조화 감사 event를 사용했다. 현재 요구에는 가장 단순하지만 외부 로그 보존·재생 SLO가 필요하다는 운영 근거가 생기면 별도 ADR로 durable journal을 검토해야 한다.

## 추론과 제한

계약·통합 test, production build와 격리 E2E를 근거로 기존 관리자 자료실 흐름이 유지됐다는 결론은 강한 추론이지만 production traffic 검증은 아니다. 운영 DB migration, 실제 Cloudflare R2 업로드·공개 조회·삭제, 외부 로그 보존, 부하·지연과 process crash 직후 재조정은 수행하지 않았으므로 검증된 사실로 간주하지 않는다.
