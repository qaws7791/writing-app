# WA-18 어드민 인메모리 페이징 분석

## 2026-06-17 시작

- Notion 이슈: `WA-18 심각한 인메모리 페이징 및 성능 병목`
- 출처: `writing-app 이슈 관리` 데이터베이스의 WA-18 페이지
- 조사 범위: `packages/db/src/repositories/admin.repository.ts`의 `readCourses`, `readUsers`, `readLessonAnalytics`, 기존 LOL-31 개선 문서
- 목표: 어드민 목록/분석 조회가 실제로 전체 테이블을 메모리에 올려 페이징하는지 확인하고, 같은 문제가 반복되지 않는 쿼리 구조 개선 방향을 도출한다.

## 이슈 요약

WA-18은 `readCourses`, `readUsers`, `readLessonAnalytics`가 DB에서 전체 데이터를 읽은 뒤 JavaScript 배열의 `filter`, `sort`, `slice`로 필터링, 정렬, 페이징을 처리한다고 지적한다.

## 코드 조사

### 이미 개선된 부분

`readUsers`는 현재 이슈 본문과 다르다. `docs/linear-lol-31-admin-query-boundary.md`에 기록된 작업으로 SQL `WHERE`, `GROUP BY`, `ORDER BY`, `LIMIT`, `OFFSET` 기반으로 바뀌었다.

현재 `readUsers`는 다음을 SQL에서 처리한다.

- 상태 필터
- 이름/이메일 검색
- 완료 레슨 수 집계
- 마지막 활동일 집계
- 정렬
- 페이지 제한과 offset

다만 현재 페이지 사용자 streak 계산을 위해 해당 사용자들의 활동 날짜만 추가 조회한다.

### 여전히 남은 부분

`readCourses`는 아직 다음 구조를 가진다.

- `courseUnits` 전체 조회
- `lessons` 전체 조회
- `courses` 전체 조회
- JS `filter`, `sort`, `map`, `slice`로 상태/카테고리/검색/정렬/페이징 처리
- 각 course마다 active unit/lesson 수를 JS에서 계산

`readLessonAnalytics`도 아직 다음 구조를 가진다.

- `createLessonAnalyticsSnapshots(db)`로 lesson analytics snapshot을 만든다.
- JS `filter`로 검색한다.
- JS `sort`로 정렬한다.
- JS `slice`로 페이지를 자른다.

따라서 WA-18은 `readUsers`에 대해서는 최신 코드와 맞지 않지만, `readCourses`와 `readLessonAnalytics`에 대해서는 타당하다.

## 판단

WA-18은 타당하다. 다만 이미 해결된 `readUsers`는 대상에서 제외하고, 남은 병목은 `readCourses`와 `readLessonAnalytics`, 그리고 analytics snapshot helper들로 좁혀야 한다.

목록 API는 page size가 작더라도 전체 row를 읽으면 데이터가 늘수록 메모리와 latency가 선형으로 증가한다. 특히 어드민 코스 목록과 레슨 분석은 운영 데이터가 쌓이는 화면이므로 DB query boundary에서 필터링과 페이지네이션을 끝내야 한다.

## 해결 방안

### 방안 1. readCourses를 SQL 집계 쿼리로 바꾼다

`readCourses`는 SQL에서 상태, 카테고리, 검색 조건을 적용하고, active unit/lesson 수를 aggregate subquery로 계산한다.

필요한 쿼리:

- total count query
- page item query
- active unit count subquery
- active lesson count subquery

`ORDER BY courses.sort_order`, `LIMIT`, `OFFSET`을 DB에서 수행한다.

장점은 코스 수, 유닛 수, 레슨 수가 늘어나도 현재 페이지에 필요한 결과만 애플리케이션으로 넘어온다는 점이다.

추천 강도: 높음.

### 방안 2. readLessonAnalytics를 SQL read model로 재작성한다

`createLessonAnalyticsSnapshots()`가 만드는 값을 SQL query로 계산한다.

예상 집계:

- active course/unit/lesson 기준 lesson 목록
- lesson별 완료 수
- lesson별 시작 또는 진행 수
- drop-off rate 계산에 필요한 denominator/numerator
- 검색 조건
- 정렬 조건
- `LIMIT`, `OFFSET`

장점은 analytics 페이지가 데이터 증가에 더 안정적이고, worst lesson dashboard 집계와 같은 원천을 공유할 수 있다는 점이다.

추천 강도: 높음.

### 방안 3. 어드민 목록 쿼리 helper를 만든다

`readUsers`는 이미 SQL 경계로 이동했지만, 같은 패턴이 다시 생기지 않게 공통 query helper를 만든다.

예상 역할:

- page/pageSize 보정
- total count와 page items 조회를 명시적으로 분리
- sort key를 SQL expression mapping으로 제한
- query string 검색 조건 생성

장점은 새 어드민 목록 화면이 추가될 때 `.all().filter().slice()` 패턴을 다시 만들 가능성을 줄인다.

추천 강도: 중간 이상.

### 방안 4. 구조 회귀 테스트를 readCourses/readLessonAnalytics까지 확장한다

현재 `readUsers`에는 `.slice(` 재도입을 막는 구조 테스트가 있다. 같은 테스트를 `readCourses`, `readLessonAnalytics`에도 추가한다.

테스트 방향:

- 해당 함수 source에 `.slice(`가 없는지 확인한다.
- page size보다 많은 fixture를 넣고 DB query 결과가 올바른 total/page를 반환하는지 검증한다.
- 정렬/검색이 SQL 결과와 일치하는지 테스트한다.

장점은 이미 한 번 반복된 문제를 자동으로 막을 수 있다는 점이다.

추천 강도: 중간.

## 권장 순서

1. `readCourses`를 SQL 필터/집계/페이징으로 바꾸고 구조 테스트를 추가한다.
2. `readLessonAnalytics`를 SQL read model로 바꾸고 정렬별 테스트를 추가한다.
3. dashboard의 `worstLessons`가 같은 lesson analytics query를 재사용하도록 원천을 통합한다.
4. 어드민 목록 query helper를 도입해 새 목록 화면의 query boundary를 표준화한다.
5. `.all().filter().sort().slice()` 패턴을 repository에서 검색하는 회귀 테스트를 확대한다.

## 검증 계획

- `bun --filter @workspace/db test src/repositories/admin.repository.test.ts`
- `bun --filter @workspace/admin-api test src/routes/analytics.route.test.ts src/routes/courses.route.test.ts`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/admin-api typecheck`

## 2026-06-17 완료

- Notion `WA-18` 내용을 확인했다.
- `readUsers`는 기존 LOL-31 작업으로 이미 SQL 페이징이 적용되어 있어 이슈 본문 일부는 최신 코드와 다르다고 확인했다.
- `readCourses`와 `readLessonAnalytics`에는 여전히 인메모리 필터, 정렬, 페이징이 남아 있어 WA-18은 타당하다고 판단했다.
- SQL 집계 쿼리 전환, lesson analytics read model, 어드민 목록 query helper, 구조 회귀 테스트 확대의 4가지 개선 방안을 도출했다.
- `readCourses`는 상태, 카테고리, 검색 조건을 SQL `WHERE`로 적용하고, active unit/lesson 수를 aggregate expression으로 계산한다.
- `readCourses`는 total count query와 page row query를 분리하고 `ORDER BY`, `LIMIT`, `OFFSET`을 DB 경계에서 수행한다.
- `readLessonAnalytics`는 active course/unit/lesson과 active learner 조건을 SQL join과 aggregate expression으로 계산한다.
- 레슨별 분석의 완료율, 이탈률, 정렬, 검색, 페이지 제한도 DB query boundary에서 처리한다.
- page/pageSize 보정은 `createPageBounds()` helper로 모아 어드민 목록 query가 같은 페이지 계산 규칙을 쓰게 했다.
- 구조 회귀 테스트를 `readCourses`, `readLessonAnalytics`까지 확장해 `.slice(`와 `.all().filter` 패턴 재도입을 막는다.

## 검증 결과

- `bun --filter @workspace/db test src/repositories/admin.repository.test.ts`
- `bun --filter @workspace/admin-api test src/routes/analytics.route.test.ts src/routes/courses.route.test.ts`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/admin-api typecheck`
- `bun --filter @workspace/db lint`
- `bun --filter @workspace/admin-api lint`
