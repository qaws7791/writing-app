# WA-11 콘텐츠 reset 보관 처리 N+1 쿼리 조사

## 이슈 출처

- Notion 데이터베이스: `writing-app 이슈 관리`
- ID: `WA-11`
- 제목: `다중 레코드 갱신 시 N+1 쿼리 문제`
- 발견 위치: `packages/db/src/repositories/admin.repository.ts`의 `archiveContentOutsideSeed`

## 결론

WA-11은 타당하다. 현재 `resetContent`는 기본 seed에 없는 콘텐츠를 보관 처리할 때 `courses`, `course_units`, `lessons`, `lesson_steps` 전체를 각각 읽고, seed에 없는 활성 행마다 개별 `UPDATE`를 실행한다. 데이터가 많아지면 테이블별 `SELECT all`과 행 단위 `UPDATE`가 함께 증가한다.

이 문제는 코스 테이블 하나의 최적화 문제가 아니다. seed CLI에는 이미 `archiveRowsNotIn` 기반의 벌크 보관 로직이 있고, 어드민 reset에는 같은 정책이 별도 구현으로 중복되어 있다. 따라서 근본 해결 방향은 보관 정책을 한 곳에 모으고, 어드민 reset과 seed CLI가 같은 구현을 사용하게 만드는 것이다.

## 코드베이스 근거

- `packages/db/src/repositories/admin.repository.ts`
  - `resetContent`는 트랜잭션 내부에서 `archiveContentOutsideSeed`를 먼저 실행한 뒤 seed 행을 upsert한다.
  - `archiveContentOutsideSeed`는 네 테이블을 모두 `.all()`로 읽고, 각 행을 순회하면서 개별 `db.update(...).where(eq(id, row.id)).run()`을 호출한다.
  - `readNextContentRevision`도 모든 course 행을 읽어 JS에서 최대 revision을 계산한다. WA-11의 직접 범위는 아니지만 같은 reset 경로에 있는 선형 스캔이다.
- `packages/db/src/seeds/seed.ts`
  - 개발 DB seed 경로는 `archiveMissingContentRows`와 `archiveRowsNotIn`을 통해 `UPDATE ... WHERE id NOT IN (...)` 형태의 벌크 보관을 이미 사용한다.
  - table name은 제한된 union type으로 받고 값은 SQL placeholder로 넣는 형태라, 위험한 문자열 조합을 피하려는 선행 설계가 있다.
- `packages/db/src/repositories/admin.repository.test.ts`
  - repository 테스트는 이미 “DB 쿼리 경계에서 처리한다”는 구조 회귀 테스트를 일부 포함한다.
  - 다만 `archiveContentOutsideSeed`가 행 단위 update를 하지 않는다는 회귀 테스트는 없다.

## 해결 방법 후보

### 1. 콘텐츠 보관 정책 모듈을 만들고 두 경로가 공유한다

`packages/db/src/repositories` 또는 `packages/db/src/content` 근처에 seed 외 콘텐츠 보관 전용 Module을 둔다. 이 Module은 `courses`, `course_units`, `lessons`, `lesson_steps`의 활성 seed ID 목록을 받아 테이블별 벌크 `UPDATE`와 변경 수 집계를 담당한다. `packages/db/src/seeds/seed.ts`와 `admin.repository.ts`는 모두 이 Module을 호출한다.

장점:

- 같은 정책이 한 구현에 모여 재발 가능성이 가장 낮다.
- 어드민 reset과 CLI seed의 동작 차이를 줄인다.
- 테스트 표면을 “seed 외 콘텐츠 보관 Module” 하나로 좁힐 수 있다.

주의점:

- Drizzle의 `transaction.run(sql...)` 기반 구현을 public DB helper로 노출할지, repository 내부 helper로 둘지 결정해야 한다.
- 행 수 집계가 필요하면 SQLite의 변경 수 API 또는 `RETURNING` 지원 여부를 확인해 deterministic하게 계산해야 한다.

추천도: 높음.

### 2. `archiveContentOutsideSeed` 내부만 벌크 UPDATE로 교체한다

현재 함수의 형태는 유지하되, 네 테이블 순회를 각각 `UPDATE table SET status = archived WHERE status != archived AND id NOT IN (...)`로 바꾼다. seed CLI의 `archiveRowsNotIn` 구현을 참고하되, 중복은 당장 감수한다.

장점:

- 변경 범위가 작고 위험이 낮다.
- WA-11의 직접 성능 문제는 빠르게 사라진다.
- 기존 `resetContent` interface는 유지된다.

주의점:

- seed CLI와 어드민 reset의 보관 정책 중복은 남는다.
- 같은 문제가 다른 경로에서 다시 생길 수 있다.
- “벌크 보관은 이렇게 한다”는 명시적 Module이 생기지 않아 구조적 안전성은 제한적이다.

추천도: 중간. 빠른 수습에는 좋지만 사용자가 요청한 “재발 방지” 관점에서는 부족하다.

### 3. reset 전체를 콘텐츠 동기화 Module로 승격한다

보관뿐 아니라 `resetContent`의 revision 계산, 보관, 코스/유닛/레슨/스텝 upsert까지 하나의 콘텐츠 동기화 Module로 모은다. 이 Module은 seed row 묶음과 revision 정책을 입력받고, 결과로 변경 요약을 반환한다. 어드민 repository는 HTTP/도메인 입력을 DB 동기화 명령으로 연결하는 얇은 Adapter가 된다.

장점:

- reset의 상태 전이가 한 곳에서 설명된다.
- revision 계산의 전체 스캔도 `SELECT max(curriculum_revision)`로 함께 개선할 수 있다.
- 추후 seed 구조가 바뀌어도 repository가 비대해지는 것을 막는다.

주의점:

- 변경 범위가 가장 크다.
- 현재 upsert 루프까지 포함하면 테스트 범위를 넓혀야 한다.
- 아직 reset 호출자가 많지 않다면 과한 Module 분리가 될 수 있다.

추천도: 중간에서 높음. reset 경로를 장기적으로 자주 확장할 계획이면 가장 안정적이다.

### 4. DB 레벨의 콘텐츠 생명주기 명령으로 고정한다

SQLite SQL을 명시적으로 작성해 `archive_missing_content`, `upsert_seed_content`, `next_revision` 같은 작은 DB 명령 함수로 나눈다. 각 명령은 table union과 row type을 좁게 받아 SQL 실행만 담당하고, 상위 Module이 실행 순서를 가진다.

장점:

- 성능 특성이 가장 투명하다.
- table name과 SQL 값의 취급 규칙을 한 곳에서 강제할 수 있다.
- 성능 회귀 테스트가 단순해진다.

주의점:

- Drizzle DSL과 raw SQL이 섞이는 기준을 문서화해야 한다.
- 명령 함수가 너무 잘게 쪼개지면 얕은 Module이 늘어날 수 있다.

추천도: 중간. SQL 제어를 명확히 해야 하는 DB 핵심 경로라면 좋은 선택이다.

## 권장 방향

1번을 우선 권장한다. `archiveContentOutsideSeed`만 고치면 증상은 사라지지만, 이미 seed CLI에 같은 정책이 존재하기 때문에 중복이 남는다. 보관 정책을 공유 Module로 모으면 변경의 locality가 좋아지고, 어드민 reset과 CLI seed가 같은 규칙을 따른다는 leverage가 생긴다.

## 구현 결정

WA-11은 공유 보관 정책 Module 방식으로 처리한다.

- 새 Module은 `packages/db/src/content/content-archive-policy.ts`에 둔다.
- `archiveContentRowsOutsideSeed`는 `ContentSeedRows`를 입력으로 받아 네 콘텐츠 테이블의 seed ID 목록을 계산한다.
- 보관은 테이블별 `UPDATE ... WHERE status != archived AND id NOT IN (...)` 쿼리로 수행한다.
- 이미 보관된 행은 다시 쓰지 않으며, 같은 트랜잭션에서 SQLite `changes()`를 조회해 `changed.archived`에 반영한다.
- `packages/db/src/seeds/seed.ts`와 `packages/db/src/repositories/admin.repository.ts`는 같은 Module을 호출한다.
- `readNextContentRevision`은 전체 course row를 읽지 않고 DB의 `max(curriculum_revision)` 집계로 다음 revision을 계산한다.

구현 시 함께 처리할 항목:

- `archiveRowsNotIn`에 `WHERE status != archived` 조건을 포함해 불필요한 write를 막는다.
- 빈 seed ID 배열일 때는 해당 테이블의 archived가 아닌 행만 보관한다.
- 변경 수를 `resetContent.changed.archived`에 반영하는 방식을 명시적으로 테스트한다.
- 새 보관 Module이 `.all()` 후 행 단위 update를 하지 않는다는 회귀 테스트를 추가한다.
- `readNextContentRevision`도 `SELECT max(curriculum_revision)` 성격의 집계 쿼리로 바꿔 reset 경로의 다른 선형 스캔을 함께 제거한다.

## 검증 계획

- `packages/db` repository 테스트에서 seed 외 course/unit/lesson/step을 여러 개 만든 뒤 `resetContent`가 한 번에 보관하고 변경 수를 정확히 반환하는지 확인한다.
- 소스 회귀 테스트는 기존 패턴처럼 `archiveContentOutsideSeed` 또는 새 Module의 source를 읽어 `.select().from(...).all()` 뒤 개별 `.update()`가 재등장하지 않도록 막는다.
- 가능하면 SQLite trace나 wrapper를 이용해 reset 중 보관 단계의 update 쿼리 수가 테이블 수에 비례하는지 확인한다.
- 전체 검증은 `bun test packages/db` 또는 저장소 표준 pre-commit인 `bun lefthook run pre-commit`으로 마무리한다.

## 검증 결과

- `bun --filter @workspace/db test`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/db lint`
- `bunx oxfmt --check packages/db/src/content/content-archive-policy.ts packages/db/src/content/content-archive-policy.test.ts packages/db/src/repositories/admin.repository.ts packages/db/src/repositories/admin.repository.test.ts packages/db/src/seeds/seed.ts docs/wa-11-content-reset-n-plus-one-research.md`
