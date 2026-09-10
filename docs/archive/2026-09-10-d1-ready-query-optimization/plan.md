# D1 호환 쿼리 최적화 계획

## 문서 상태

- 상태: 구현과 저장소 검증 완료
- 작성일: 2026-09-10
- 기준 커밋: `01756695e843d190f4b6d608f29369f1432f020c`
- 입력: 현재 SQLite 쿼리 조사와 D1 제약 검토
- 현재 저장소: Bun SQLite와 Drizzle ORM 사용

## 구현 결과

1. Q-01부터 Q-17까지의 조회 위험을 수정했다.
2. 목록 필터, 정렬과 페이지네이션을 SQL keyset cursor 조회로 이동했다.
3. 제목, 이름과 이메일의 부분 검색을 FTS5 조회로 이동했다.
4. 관리자 지표와 레슨 분석을 영속 rollup 조회로 이동했다.
5. bulk 문장을 bound parameter 100개 이하의 chunk로 분할했다.
6. session, profile, asset, 학습 진행과 목록 조회에 필요한 index를 추가했다.
7. D1 driver와 Cloudflare 배포 설정은 변경하지 않았다.
8. 사용자 지시에 따라 테스트 코드를 추가하거나 수정하지 않았다.

## 목표

현재 SQLite에서 불필요한 행 읽기와 정렬을 제거한다.

변경한 쿼리는 향후 D1 전환 후에도 동일한 접근 경로를 유지해야 한다.

모든 변경은 결과 순서, 필터 의미, 권한 규칙과 transaction 경계를 보존해야 한다.

## 범위

### 포함

1. 전체 행을 읽은 뒤 애플리케이션에서 필터·정렬·페이지네이션하는 조회를 SQL 조회로 변경한다.
2. 자주 실행하는 조건·정렬 쿼리에 필요한 index를 추가한다.
3. 깊은 offset 비용이 큰 목록을 keyset cursor로 변경한다.
4. 검색 쿼리에 사용할 indexable 검색 방식을 결정하고 적용한다.
5. 반복 집계 조회를 bounded query 또는 reporting rollup으로 변경한다.
6. 모든 bulk 쿼리가 문장당 bind parameter 100개 이하를 사용하도록 변경한다.
7. `EXPLAIN QUERY PLAN`과 고정 규모 fixture로 회귀를 검출한다.
8. 변경된 데이터 계약과 운영 계약을 권위 문서에 반영한다.

### 제외

1. D1 driver 도입은 이 작업에 포함하지 않는다.
2. Cloudflare 배포 설정은 이 작업에 포함하지 않는다.
3. D1 데이터 이관은 이 작업에 포함하지 않는다.
4. 제품 요구가 없는 캐시 계층은 추가하지 않는다.
5. 쿼리 변경과 무관한 module 재구성은 수행하지 않는다.

## 적용할 D1 제약

이 작업은 현재 SQLite에서 실행한다.

다음 제약은 D1 전환 전 호환성 기준으로 적용한다.

| 제약                                | 구현 기준                                                          |
| ----------------------------------- | ------------------------------------------------------------------ |
| 읽은 행 기준 과금                   | 페이지 크기와 무관한 전체 읽기를 금지한다.                         |
| bind parameter 최대 100개           | 문장별 parameter 수를 100개 이하로 제한한다.                       |
| `LIKE`·`GLOB` pattern 최대 50 bytes | 해당 연산을 제거하거나 UTF-8 byte 길이를 계약에서 제한한다.        |
| query 최대 실행 시간 30초           | 무제한 집계와 무제한 정렬을 제거한다.                              |
| database 단일 실행 대기열           | 긴 reporting query가 제품 command를 막지 않도록 읽기량을 제한한다. |

제약의 권위 소스는 [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)와 [D1 index 지침](https://developers.cloudflare.com/d1/best-practices/use-indexes/)이다.

## 완료 기준

1. 사용자 요청 경로의 목록 조회는 `limit + 1`개 이하의 결과 후보만 반환한다.
2. cursor 조건은 SQL `WHERE`에 포함한다.
3. 정렬은 cursor와 같은 index 순서를 사용한다.
4. 유지보수 batch 선택은 filter·order·limit을 한 index에서 처리한다.
5. 의도하지 않은 `SCAN <table>`은 query-plan 검증에서 실패한다.
6. 의도하지 않은 `USE TEMP B-TREE`는 query-plan 검증에서 실패한다.
7. 의도한 scan은 예상 최대 행 수와 실행 주기를 코드 가까이에 기록한다.
8. 생성된 SQL 문장 하나는 bind parameter 100개를 초과하지 않는다.
9. 목록 API의 첫 페이지와 다음 페이지에 중복 또는 누락이 없다.
10. 동일 정렬 키가 있는 행은 `id`를 최종 tie-breaker로 사용한다.
11. query-plan 검증은 실행 시간 대신 planner 출력과 반환 행 수를 검사한다.
12. exact total 조회는 bounded dataset 또는 rollup만 사용한다.
13. 전체 repository gate가 통과한다.

## 문제 목록

| ID   | 우선순위 | 영역                | 현재 문제                                                                   | 목표                                                                                      |
| ---- | -------- | ------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Q-01 | P0       | 관리자 사용자 목록  | 전체 사용자와 전체 profile을 읽은 뒤 메모리에서 검색·정렬·페이지네이션한다. | module reporting view를 조합한 bounded query가 필터·정렬·cursor·limit을 SQL에서 처리한다. |
| Q-02 | P0       | 관리자 사용자 통계  | 전체 user ID를 `IN (...)`에 넣어 progress와 activity를 조회한다.            | Q-01 projection에서 필요한 집계를 join하거나 rollup한다.                                  |
| Q-03 | P0       | 학습 진행 목록      | 한 사용자의 전체 course progress를 읽은 뒤 cursor를 적용한다.               | status·cursor·limit을 SQL에 적용한다.                                                     |
| Q-04 | P0       | 공개 강의 목록      | 전체 공개 course와 lesson 수를 읽은 뒤 category와 cursor를 적용한다.        | category·cursor·limit과 lesson 집계를 하나의 bounded query로 처리한다.                    |
| Q-05 | P0       | session 만료 정리   | `expires_at` 정렬을 지원하는 index가 없다.                                  | learner와 admin session에 `(expires_at, id)` index를 추가한다.                            |
| Q-06 | P0       | 삭제 학습자 정리    | 삭제 상태와 `deleted_at` 정렬을 지원하는 index가 없다.                      | 삭제 행 전용 partial index를 추가한다.                                                    |
| Q-07 | P0       | orphan asset 정리   | 기존 course 중심 index가 orphan 조회를 지원하지 않는다.                     | orphan 행 전용 partial index를 추가한다.                                                  |
| Q-08 | P1       | 관리자 강의 검색    | `%term%` 검색이 전체 scan을 수행한다.                                       | D1 호환 검색 index로 현재 substring 의미를 보존한다.                                      |
| Q-09 | P1       | 관리자 강의 집계    | unit과 lesson을 독립 join하여 중간 행이 곱집합으로 증가한다.                | 각 집계를 먼저 축약한 뒤 course에 join한다.                                               |
| Q-10 | P1       | 글쓰기 과제 검색    | `instr(lower(title), ...)`가 전체 scan을 수행한다.                          | Q-08과 같은 검색 정책을 적용한다.                                                         |
| Q-11 | P1       | 운영 reporting      | dashboard와 series가 전체 이력을 반복 집계한다.                             | 기간 제한과 증분 rollup으로 요청당 읽기량을 고정한다.                                     |
| Q-12 | P1       | 레슨 분석           | 같은 큰 CTE를 count와 page 조회에서 두 번 실행한다.                         | count 계약을 분리하거나 집계 결과를 재사용한다.                                           |
| Q-13 | P1       | 인증 조회           | session user, account provider, verification 정리 index가 부족하다.         | 실제 Better Auth 조회 조건에 맞는 최소 index를 추가한다.                                  |
| Q-14 | P1       | bulk statement      | `inArray()`와 multi-row insert가 parameter 100개를 넘을 수 있다.            | operation별 안전한 chunk 크기를 계산한다.                                                 |
| Q-15 | P2       | offset pagination   | writing task, course, audit와 lesson analytics가 깊은 offset을 사용한다.    | 증가량이 큰 목록부터 keyset cursor로 변경한다.                                            |
| Q-16 | P2       | 사용자 글 목록      | user index는 있으나 반환 개수가 제한되지 않는다.                            | cursor와 page size를 계약에 추가한다.                                                     |
| Q-17 | P2       | 학습 단건 보조 조회 | 일부 `user_id + lesson_id` 조회가 course 중심 index만 사용한다.             | 실제 predicate와 일치하는 index 또는 query 형태를 사용한다.                               |

PK 조회, unique 조회와 composite PK 중심 learning transition은 변경 대상에서 제외한다.

## 구현 순서

각 단계는 별도 PR로 제출할 수 있어야 한다.

후속 단계는 선행 단계의 완료 기준을 통과한 뒤 시작한다.

### 1단계: 측정 기준과 전체 쿼리 원장 확정

대상:

- `apps/api/src`
- `packages/modules/*/src/infrastructure/persistence`
- `packages/infra/auth/src`

작업:

1. 사용자 요청, cron, 정리 command와 reporting에서 실행하는 SQL을 전수 분류한다.
2. 각 SQL에 호출 경로, 필터, 정렬, page 크기, 예상 cardinality와 index를 기록한다.
3. `select().all()`과 무제한 raw SQL을 정적 검색한다.
4. `inArray()`와 multi-row insert의 최대 parameter 수를 계산한다.
5. 고정 규모 SQLite fixture를 persistence 통합 테스트에 추가한다.
6. 중요한 query에 `EXPLAIN QUERY PLAN` 회귀 검증을 추가한다.
7. 계획의 문제 목록에 누락된 query가 있으면 같은 작업 단위에서 추가한다.

fixture 최소 규모:

| 데이터          | 최소 행 수 |
| --------------- | ---------: |
| 학습자          |        250 |
| learner session |     10,000 |
| course          |        200 |
| lesson          |     10,000 |
| lesson progress |    100,000 |
| writing         |     20,000 |
| audit event     |    100,000 |
| content asset   |     20,000 |

완료 조건:

1. 문제 목록의 모든 query에 baseline plan이 있다.
2. 새 query-plan 검증이 현재 알려진 full scan을 재현한다.
3. 검증은 wall-clock 임계값을 사용하지 않는다.

### 2단계: 유지보수와 인증 index 추가

대상:

- `packages/infra/auth/src/schema/learner-auth.schema.ts`
- `packages/infra/auth/src/schema/admin-auth.schema.ts`
- `packages/modules/identity/src/infrastructure/persistence/schema.ts`
- `packages/modules/content/src/infrastructure/persistence/schema.ts`
- `apps/api/src/maintenance/expired-session-maintenance.ts`
- API append-only migration

작업:

1. learner session과 admin session에 `(expires_at, id)` index를 추가한다.
2. learner session과 admin session에 `(user_id)` index를 추가한다.
3. learner account와 admin account에 `(account_id, provider_id)` index를 추가한다.
4. learner account와 admin account에 `(user_id)` index를 추가한다.
5. learner verification과 admin verification에 `(identifier, created_at)` index를 추가한다.
6. learner verification과 admin verification에 `(expires_at)` index를 추가한다.
7. `learner_profiles`에 `(deleted_at, user_id)` partial index를 추가한다.
8. `content_assets`에 `(orphaned_at, id)` partial index를 추가한다.
9. account provider 조합을 unique로 만들기 전에 기존 데이터와 Better Auth 불변식을 확인한다.
10. 사용하지 않는 중복 index는 query-plan 확인 후 제거한다.

partial index 조건:

- 삭제 학습자: `status = 'deleted' AND deleted_at IS NOT NULL`
- orphan asset: `status = 'orphaned' AND orphaned_at IS NOT NULL`

완료 조건:

1. session 만료 선택에 table scan과 임시 정렬이 없다.
2. 삭제 학습자 선택에 table scan과 임시 정렬이 없다.
3. orphan asset 선택에 table scan과 임시 정렬이 없다.
4. Better Auth의 확인된 조회 경로가 대상 index를 사용한다.

### 3단계: 관리자 사용자 목록을 단일 bounded query로 변경

대상:

- `packages/modules/identity/src/application/learner-account-reader.ts`
- `packages/modules/identity/src/application/identity-queries.ts`
- `apps/api/src/adapters/auth/learner-identity-directory.ts`
- `packages/modules/identity/src/infrastructure/persistence/identity-drizzle-repository.ts`
- `packages/modules/learning/src/infrastructure/persistence/learning-reporting-drizzle-repository.ts`
- module reporting view와 API migration

작업:

1. 현재 필터, 정렬과 반환 필드의 제품 계약을 고정한다.
2. identity와 learning module이 필요한 reporting view를 각각 공개한다.
3. operations reporting repository가 두 view를 결합한다.
4. 기존 관리자 사용자 HTTP contract는 새 reporting query를 호출한다.
5. 원본 schema 소유권은 각 module에 유지한다.
6. 검색, 상태, 정렬, cursor와 `limit + 1`을 SQL에 전달한다.
7. 완료 레슨 수, streak와 최근 활동은 page 대상에 대해서만 읽거나 rollup에서 읽는다.
8. 전체 user ID를 받는 learning reporting port를 제거한다.
9. 정렬 키별 cursor에 `user_id` tie-breaker를 포함한다.
10. exact total을 `hasNextPage`로 교체한다.
11. 제품 요구로 exact total이 필요하면 bounded counter 또는 rollup을 사용한다.
12. 임의 검색 결과의 unbounded exact total은 제품 계약에서 제거한다.

완료 조건:

1. page size 20 요청이 전체 학습자 또는 전체 학습 이력을 materialize하지 않는다.
2. 학습자 250명 입력에서도 statement parameter 수가 일정하다.
3. 모든 정렬 variant에서 page 중복과 누락이 없다.

### 4단계: 학습 진행 목록과 공개 강의 목록 pushdown

대상:

- `packages/modules/learning/src/infrastructure/persistence/learning-read-drizzle-repository.ts`
- `packages/modules/content/src/infrastructure/persistence/content-published-query-drizzle.ts`
- 관련 application port와 HTTP contract

작업:

1. 학습 진행 status, cursor와 `limit + 1`을 repository query에 전달한다.
2. 학습 진행 상세를 page 대상 course ID만 사용해 조회한다.
3. 공개 강의 category, cursor와 `limit + 1`을 content query에 전달한다.
4. 공개 lesson 수는 course별 pre-aggregate 또는 correlated subquery로 계산한다.
5. category와 정렬 순서를 지원하는 index를 추가한다.
6. cursor의 정렬 값과 ID를 opaque contract로 유지한다.

완료 조건:

1. page 크기를 늘리지 않으면 읽는 course 수가 전체 catalog 크기에 비례하지 않는다.
2. 학습 진행 next page가 이전 page의 상세를 다시 읽지 않는다.
3. 공개 강의 필터 결과가 기존 동작과 동일하다.

### 5단계: 관리자 강의와 글쓰기 과제 검색 개선

대상:

- `packages/modules/content/src/infrastructure/persistence/content-course-drizzle.ts`
- `packages/modules/writing/src/infrastructure/persistence/writing-drizzle-repository.ts`
- `packages/shared/contracts/src/content/admin-routes.ts`
- 관련 migration

사전 결정:

1. Bun SQLite와 D1에서 사용할 수 있는 FTS5 tokenizer를 같은 fixture로 확인한다.
2. 한국어 제목의 substring 결과가 현재 결과와 일치하는지 확인한다.
3. FTS5 trigram이 두 환경에서 같은 계약을 충족하면 FTS5를 선택한다.
4. FTS5가 계약을 충족하지 않으면 검색 의미를 prefix로 변경할지 제품 결정을 받는다.
5. 제품 결정 없이 substring 검색을 prefix 검색으로 바꾸지 않는다.

작업:

1. 선택한 검색 index와 원본 행의 동기화 방식을 migration에 정의한다.
2. 쓰기 transaction에서 검색 index를 함께 갱신한다.
3. course의 unit 수와 lesson 수를 각각 먼저 aggregate한다.
4. 두 aggregate를 course page에 join한다.
5. 검색 contract의 UTF-8 byte 제한을 D1 제약과 일치시킨다.
6. 검색 결과의 안정 정렬과 cursor를 추가한다.

완료 조건:

1. 제목 검색이 원본 table 전체 scan을 수행하지 않는다.
2. course 집계가 unit 수와 lesson 수의 곱만큼 중간 행을 만들지 않는다.
3. 한글, 영문, 공백과 특수문자 fixture가 기존 검색 계약을 충족한다.
4. 50 bytes를 넘는 `LIKE` 또는 `GLOB` pattern을 D1로 보낼 수 없다.

### 6단계: 운영 reporting 읽기량 제한

대상:

- `packages/modules/operations/src/infrastructure/persistence/operations-reporting-sqlite-repository.ts`
- 각 module의 `reporting-view.ts`
- 관련 migration과 reporting contract

작업:

1. dashboard metric별 원본 event와 갱신 시점을 정의한다.
2. 일별 metric을 저장하는 증분 rollup schema를 추가한다.
3. 같은 transaction에서 갱신할 수 있는 metric만 동기식으로 갱신한다.
4. 나머지 metric에는 idempotent rebuild command와 checkpoint를 둔다.
5. daily series는 요청 기간에 해당하는 rollup 행만 읽는다.
6. lesson analytics의 exact total을 제거하거나 rollup에서 읽는다.
7. worst lesson 조회는 기간, 최소 시도 수와 limit을 SQL에 적용한다.
8. rollup 원본과 결과를 비교하는 reconciliation query를 운영 점검에 추가한다.

완료 조건:

1. dashboard 요청의 읽기량이 전체 event와 progress 행 수에 비례하지 않는다.
2. daily series의 읽기량은 요청 일수에 비례한다.
3. rollup 재실행이 같은 결과를 만든다.
4. rollup 지연 또는 실패 상태를 운영자가 확인할 수 있다.

### 7단계: bulk statement를 D1 parameter 한도에 맞춤

대상:

- `packages/modules/content/src/infrastructure/persistence/content-draft-publish-drizzle.ts`
- 모든 learner purge adapter
- session cleanup
- deletion marker reapplication
- asset 상태 변경
- audit retention
- 모든 `inArray()`와 multi-row insert

작업:

1. operation별 고정 parameter 수와 row별 parameter 수를 계산한다.
2. `floor((100 - fixedParameters) / parametersPerRow)`로 최대 chunk 크기를 정한다.
3. 계산 결과가 1보다 작으면 statement 형태를 다시 설계한다.
4. chunk 실행은 기존 transaction 안에서 완료한다.
5. 빈 배열은 SQL을 만들지 않고 명시적으로 종료한다.
6. 전체 범위에 같은 불변식이 확인된 경우에만 공용 helper를 만든다.
7. 최대 입력과 최대 입력 다음 값으로 parameter 회귀 테스트를 추가한다.

완료 조건:

1. 허용된 최대 API 입력에서 SQL 문장당 parameter 수가 100개 이하이다.
2. 101명 이상의 학습자 정리 작업이 여러 bounded statement로 완료된다.
3. 중간 chunk 실패 시 transaction이 부분 결과를 남기지 않는다.

### 8단계: 남은 무제한 목록과 offset 제거

대상:

- writing task 목록
- course 관리 목록
- audit event 목록
- lesson analytics 목록
- 사용자 글 목록

작업:

1. 예상 증가율과 호출 빈도로 변환 순서를 정한다.
2. 고성장 목록부터 keyset cursor를 추가한다.
3. `updated_at`, `created_at` 또는 도메인 정렬 값 뒤에 `id`를 tie-breaker로 둔다.
4. 관리자 UI와 MCP contract가 같은 cursor 의미를 사용하게 한다.
5. unbounded exact total을 `hasNextPage`로 교체한다.
6. offset contract 제거가 호환성 파괴이면 한 release 동안 adapter를 유지한다.
7. adapter 제거 시점을 문서에 명시한다.

완료 조건:

1. page 번호가 증가해도 skip하는 행 수가 증가하지 않는다.
2. 동시 insert가 있어도 이미 본 행이 다음 page에 중복되지 않는다.
3. 사용자 글 목록은 page size 상한을 강제한다.

### 9단계: 통합 검증과 문서 정리

작업:

1. 전체 쿼리 원장을 다시 실행한다.
2. 새 query-plan을 baseline과 비교한다.
3. 모든 목록의 결과 동등성을 확인한다.
4. migration upgrade와 빈 database 생성 경로를 확인한다.
5. index 크기와 쓰기 비용을 측정한다.
6. 사용되지 않는 index를 제거한다.
7. `docs/engineering/data-model.md`에 영구 데이터 계약을 반영한다.
8. `docs/engineering/testing.md`에 query-plan 검증 계약을 반영한다.
9. 완료된 작업 디렉터리를 같은 이름으로 `docs/archive`에 이동한다.

완료 조건:

1. 문제 목록 Q-01부터 Q-17까지 결과와 증거가 기록되어 있다.
2. 남은 full scan은 bounded cardinality와 허용 근거가 있다.
3. D1 전환 시 필요한 남은 작업은 driver, deployment와 migration으로 제한된다.

## PR 분리 원칙

1. schema와 해당 migration은 같은 PR에 둔다.
2. query contract와 adapter 변경은 같은 PR에 둔다.
3. UI contract 변경은 해당 API 변경과 같은 PR에 둔다.
4. reporting rollup은 일반 목록 최적화와 분리한다.
5. 검색 방식 결정은 검색 구현 PR 전에 확정한다.
6. 각 PR은 자체 migration rollback이 아니라 forward repair 경로를 설명한다.

## 검증 명령

### 실행 결과

| 검증                  | 결과                                            |
| --------------------- | ----------------------------------------------- |
| `bun run ci:static`   | 통과                                            |
| `bun run ci:tests`    | 테스트 파일 70개와 테스트 296개 통과            |
| `bun run build`       | API, 관리자 앱, 학습자 앱과 UI 문서 빌드 통과   |
| migration checksum    | `0011`과 `0012` manifest checksum 일치          |
| query-plan 검증       | cursor 정렬, FTS, rollup과 주요 index 사용 확인 |
| `bun run test:e2e:pr` | 기존 접근성 이름 selector 3건의 불일치로 실패   |

E2E 실패 3건은 현재 화면의 접근성 이름과 기존 테스트 selector가 다른 문제다.

사용자 지시에 따라 E2E 테스트 코드는 수정하지 않았다.

각 구현 PR은 변경 범위에 해당하는 focused test를 먼저 실행한다.

각 구현 PR은 다음 repository gate를 모두 실행한다.

```sh
bun run ci:static
bun run ci:tests
bun run build
```

query 변경 PR은 다음 추가 검증을 실행한다.

```sh
bun run test
bun run test:e2e:pr
```

`bun run test:e2e:pr`은 사용자에게 보이는 목록 또는 검색 contract가 바뀐 PR에서 실행한다.

## 위험과 대응

| 위험                     | 결과                                           | 대응                                                                   |
| ------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------- |
| 검색 의미 변경           | 기존 제목이 결과에서 사라질 수 있다.           | 현재 결과 fixture를 먼저 고정하고 제품 결정 없이 의미를 바꾸지 않는다. |
| cursor 정렬 불일치       | page에 중복 또는 누락이 생길 수 있다.          | filter, order와 cursor tuple을 같은 함수에서 만든다.                   |
| index 과다 추가          | 쓰기 지연과 저장 공간이 증가할 수 있다.        | 실제 query-plan이 사용하는 index만 유지한다.                           |
| rollup 불일치            | 관리자 지표가 원본과 달라질 수 있다.           | idempotent rebuild와 reconciliation을 제공한다.                        |
| chunk 부분 실행          | purge 또는 publish가 일부만 반영될 수 있다.    | 모든 chunk를 기존 transaction 안에서 실행한다.                         |
| SQLite와 D1 planner 차이 | 로컬 검증이 D1 읽기량을 보장하지 못할 수 있다. | D1 전환 단계에서 `rows_read` 기반 acceptance test를 추가한다.          |
| 큰 migration             | 배포 중 write lock 시간이 증가할 수 있다.      | index migration을 분리하고 staging 데이터 규모로 시간을 측정한다.      |

## D1 전환 시 남길 검증

이 작업은 D1을 실행 환경으로 사용하지 않는다.

D1 전환 작업은 다음 검증만 추가로 수행한다.

1. 대표 query의 `meta.rows_read`를 page 크기와 비교한다.
2. 최대 입력에서 parameter 한도 오류가 없는지 확인한다.
3. FTS와 partial index의 실제 D1 query plan을 확인한다.
4. 30초 query timeout보다 충분히 작은 운영 상한을 확인한다.
5. Analytics에서 read query와 write query의 rows read·written 추이를 감시한다.

## 시작 순서

1. 1단계에서 원장과 실패하는 query-plan 검증을 만든다.
2. 2단계에서 저위험 index 누락을 수정한다.
3. 3단계와 4단계에서 사용자 요청당 전체 읽기를 제거한다.
4. 5단계에서 검색과 강의 집계를 수정한다.
5. 6단계에서 운영 집계를 bounded read로 변경한다.
6. 7단계에서 D1 parameter 한도를 강제한다.
7. 8단계와 9단계에서 나머지 목록과 전체 증거를 정리한다.
