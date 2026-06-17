# WA-20 어드민 Repository God Module 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-20 `거대한 Repository 파일 (God Module)`
- 조사 범위: `packages/db/src/repositories/admin.repository.ts`, `packages/db/src/repositories/admin.repository.test.ts`, `packages/core/src/admin/admin.repository.ts`, 기존 어드민 repository 개선 문서

## 이슈 요약

WA-20은 `packages/db/src/repositories/admin.repository.ts`가 Course, User, Analytics, Settings 등 어드민 영속성 로직을 하나의 파일에 몰아 넣어 유지보수성과 변경 격리를 해친다고 지적한다.

현재 파일은 1,462줄이며 다음 책임을 모두 포함한다.

- 대시보드 지표와 최근 활동 조회
- 전체 분석, 레슨 분석, 일별 시계열과 스트릭 bucket 계산
- 코스 생성, 목록, 편집 문서 조회, 보관, 콘텐츠 reset
- 운영 설정 조회와 저장
- 사용자 목록, 상세, 상태 변경, 삭제
- 다수의 row grouping, 정렬, JSON parsing, 날짜 계산 helper

## 코드 조사

### 현재 구조

`createDrizzleAdminRepository()`는 다음 네 조각을 합성한다.

- `createAdminCourseRepository`
- `createAdminUserRepository`
- `createAdminAnalyticsRepository`
- `createAdminSettingsRepository`

이는 이전 개선에서 facade 형태를 일부 도입한 결과로 보인다. 그러나 각 조각과 실제 구현 함수, 내부 helper가 여전히 같은 파일에 존재한다. 따라서 변경 단위는 여전히 `admin.repository.ts` 하나이고, 파일 충돌과 숨은 결합은 크게 줄지 않았다.

### 테스트 구조

`packages/db/src/repositories/admin.repository.test.ts`도 같은 문제를 가진다. 테스트 파일은 repository 구조를 문자열로 검사하는 테스트와 대시보드, 사용자, 코스, 분석, 설정, reset, 생성, 보관 테스트를 모두 포함한다. 이 때문에 한 도메인의 테스트 fixture가 다른 도메인 테스트의 탐색 비용을 높이고, repository 파일 분리 후에도 테스트 경계를 함께 재설계하지 않으면 실제 변경 격리는 충분히 얻기 어렵다.

### 계약 구조

`packages/core/src/admin/admin.repository.ts`의 `AdminRepository`는 어드민 전체 기능을 하나의 port로 노출한다. DB 구현만 파일을 나누더라도 core port가 하나로 남으면 application service와 route가 계속 거대한 통합 repository에 의존하기 쉽다.

## 판단

이슈는 타당하다.

현재 구현은 내부 팩터리 이름으로 책임을 구분하려는 방향은 있지만, 물리 모듈, 테스트 모듈, core repository port가 모두 큰 단위에 묶여 있다. 따라서 새 어드민 기능이 추가될 때 `admin.repository.ts`에 함수와 helper가 계속 쌓일 가능성이 높다. 이는 단순 파일 크기 문제가 아니라 운영 도구의 여러 도메인이 같은 변경 표면을 공유하는 구조 문제다.

## 개선 방안

### 방안 1. DB repository를 도메인별 파일로 분리하고 facade는 조립만 담당하게 한다

`admin.repository.ts`는 다음 정도만 남긴다.

- `createDrizzleAdminRepository(db)` facade
- 도메인별 repository factory import
- `AdminRepository` 조립

실제 구현은 아래처럼 나눈다.

- `admin-dashboard.repository.ts`
- `admin-analytics.repository.ts`
- `admin-course.repository.ts`
- `admin-settings.repository.ts`
- `admin-user.repository.ts`

각 파일은 자신에게 필요한 schema, query helper, row mapper만 import한다. 장점은 Git 충돌과 탐색 비용이 크게 줄고, 한 도메인 변경이 다른 도메인의 private helper에 손대지 않게 된다는 점이다. 단점은 초기에 import 정리와 테스트 이동 비용이 있다.

### 방안 2. core port도 기능별 repository port로 나눈다

현재 `AdminRepository`는 모든 어드민 기능을 하나의 port로 묶는다. 이를 다음처럼 명시적인 port로 분리한다.

- `AdminDashboardRepository`
- `AdminAnalyticsRepository`
- `AdminCourseRepository`
- `AdminSettingsRepository`
- `AdminUserRepository`

통합 `AdminRepository`는 composition type으로만 유지하거나 route/service wiring에서 필요한 port만 받게 한다. 장점은 route와 service가 실제로 쓰는 기능만 의존하게 되어 런타임 경계가 명확해진다. 단점은 생성자와 테스트 double 구성이 바뀌므로 migration 순서를 잘라야 한다.

### 방안 3. 테스트도 도메인별 파일과 fixture builder로 분리한다

현재 `admin.repository.test.ts`는 기능별 검증이 모두 섞여 있다. repository 파일 분리와 함께 다음 테스트 파일로 나눈다.

- `admin-dashboard.repository.test.ts`
- `admin-analytics.repository.test.ts`
- `admin-course.repository.test.ts`
- `admin-settings.repository.test.ts`
- `admin-user.repository.test.ts`

공통 DB setup은 `admin-repository-test-fixture.ts` 같은 테스트 전용 helper로 둔다. 문자열 기반 구조 테스트는 facade 조립 테스트와 각 모듈 경계 테스트로 좁힌다. 장점은 실패 위치가 도메인 단위로 드러나고, fixture 변경의 파급 범위를 줄일 수 있다.

### 방안 4. query helper와 mapper를 도메인 내부 하위 모듈로 격리한다

레슨 분석의 snapshot 생성, 코스 editor row grouping, 사용자 streak 계산처럼 순수 계산과 DB query가 섞인 부분은 도메인 repository 파일 내부에 계속 두면 다시 커진다. 도메인별로 다음 하위 파일을 둔다.

- `admin-analytics-snapshot.ts`
- `admin-course-editor-mapper.ts`
- `admin-user-activity.ts`

이 helper들은 DB client를 직접 받지 않거나, query boundary와 mapper boundary를 분리한다. 장점은 복잡한 계산을 순수 함수 테스트로 검증할 수 있고, repository 파일은 query orchestration에 집중한다.

### 방안 5. repository 크기와 금지 패턴을 회귀 테스트로 고정한다

이번 이슈는 한 번 분리해도 다시 커질 수 있다. `packages/db/src/repositories`에 대해 다음 규칙을 추가한다.

- 단일 repository 구현 파일의 최대 line count를 정한다.
- `admin.repository.ts`에는 facade 조립 외 구현 함수를 두지 않는다.
- 도메인별 repository에서 다른 도메인 schema import를 금지하거나 예외를 문서화한다.

장점은 구조 회귀를 빠르게 발견한다. 단점은 단순 line count만으로 설계를 판단하면 오탐이 생길 수 있으므로, facade와 생성 코드 같은 예외 기준을 명시해야 한다.

## 권장 진행 순서

1. `packages/core/src/admin/admin.repository.ts`에서 기능별 port type을 먼저 명시한다.
2. DB repository를 course, user, analytics, settings, dashboard 단위 파일로 이동한다.
3. `admin.repository.ts`는 facade 조립만 담당하게 축소한다.
4. 테스트 파일을 기능별로 나누고 공통 seed/setup helper를 추출한다.
5. line count와 facade-only 규칙을 회귀 테스트로 고정한다.
6. `docs/admin-site.md` 또는 별도 어드민 백엔드 문서에 repository 경계와 신규 기능 추가 규칙을 기록한다.

## 검증 계획

- `bun --filter @workspace/db test -- admin.repository`
- `bun --filter @workspace/core test -- admin`
- `bun --filter @workspace/admin-api test`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-20 본문을 읽고 `admin.repository.ts`, 관련 테스트, core repository port를 조사했다.
- 이슈는 타당하다고 판단했다.
- 개선 방향은 단순 파일 쪼개기가 아니라 core port, DB 구현, 테스트 fixture, 구조 회귀 규칙까지 함께 분리하는 방식으로 정리했다.
- 1차 구현으로 `admin.repository.ts`를 `createDrizzleAdminRepository()` facade 조립 전용 파일로 축소했다.
- DB 구현은 `admin-dashboard.repository.ts`, `admin-analytics.repository.ts`, `admin-course.repository.ts`, `admin-settings.repository.ts`, `admin-user.repository.ts`로 분리했다.
- 공통 페이지 계산, active learner 조건, 활동일 grouping, streak 계산은 `admin-repository-shared.ts`에 모아 중복 helper 생성을 피했다.
- 기존 구조 테스트는 새 파일 경계를 보도록 수정했고, facade 조립 테스트는 dashboard repository 조립까지 확인한다.
- 분리 후 파일 크기는 facade 23줄, dashboard 203줄, analytics 375줄, course 554줄, settings 96줄, user 323줄이다.
- 테스트 파일 분리와 core port 추가 분리는 후속 작업으로 남겼다. 현재 변경은 DB 구현의 물리 모듈 경계를 먼저 안정화하는 범위다.

## 검증 결과

- `bun --filter @workspace/db test src/repositories/admin.repository.test.ts`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/db lint`
- `bun --filter @workspace/admin-api test src/routes/analytics.route.test.ts src/routes/courses.route.test.ts src/routes/settings.route.test.ts`
- `bun --filter @workspace/admin-api typecheck`
- `bun --filter @workspace/admin-api lint`
