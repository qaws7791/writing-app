# Linear LOL-31 어드민 DB 쿼리 경계 검토

## 2026-06-15 시작

- Linear 이슈: `LOL-31 형편없는 DB 쿼리`
- 조사 범위: `packages/db/src/repositories/admin.repository.ts`의 `readDashboard`, `readUsers`
- 목표: 어드민 대시보드와 사용자 목록이 테이블 전체를 애플리케이션 메모리로 가져와 필터링, 정렬, 페이지네이션하는 문제를 확인하고 DB 쿼리 경계로 옮긴다.

## 판단

이슈는 타당하다.

- `readDashboard`는 사용자, 활동일, 코스, 유닛, 레슨, 진행률 테이블을 각각 `.all()`로 읽은 뒤 JS에서 집계했다.
- `readUsers`는 전체 사용자 snapshot을 만든 뒤 JS `filter`, `sort`, `slice`로 상태 필터, 검색, 정렬, 페이지네이션을 처리했다.
- 페이지 크기가 작아도 전체 행을 메모리에 올리는 구조라 사용자 수와 활동 로그가 늘수록 API 메모리 사용량이 선형으로 증가한다.

## 2026-06-15 완료

- `readDashboard`의 주요 지표를 SQL `count`, `countDistinct`, `JOIN`, `WHERE` 집계로 이동했다.
- 최근 활동은 DB에서 `GROUP BY`, `ORDER BY`, `LIMIT`으로 5명만 가져온 뒤, streak 계산에 필요한 활동 날짜만 해당 사용자 ID로 추가 조회한다.
- `readUsers`는 SQL `WHERE`, `GROUP BY`, `ORDER BY`, `LIMIT`, `OFFSET`으로 검색, 상태 필터, 집계 정렬, 페이지네이션을 처리한다.
- 사용자 목록의 streak 값은 현재 페이지 사용자에 대해서만 활동 날짜를 조회해 계산한다.
- `readUsers`에 JS 배열 `.slice()` 페이지네이션이 다시 들어오지 않도록 구조 테스트를 추가했다.

## 검증

- `bun --filter @workspace/db test src/repositories/admin.repository.test.ts`
- `bun --filter @workspace/db typecheck`
