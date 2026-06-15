# LOL-27 테스트 의존성 중복 조사

## 개요

- Linear 이슈: `LOL-27`
- 제목: 테스트 코드의 악취
- 조사일: 2026-06-15
- 결론: 문제 제기는 타당하다. 다만 이슈 본문의 "테스트 파일 30개" 수준은 현재 코드 기준으로 과장되어 있으며, 핵심 문제는 `apps/admin-api` 테스트의 `AdminApiDependencies` 반복 작성에 집중되어 있다.

## 확인한 현상

`createDependencies()`는 현재 `Kwep`을 제외하고 8개 테스트 파일에 존재한다.

- `apps/admin-api/src/app.test.ts`
- `apps/admin-api/src/routes/analytics.route.test.ts`
- `apps/admin-api/src/routes/courses.route.test.ts`
- `apps/admin-api/src/routes/curriculum-editor.route.test.ts`
- `apps/admin-api/src/routes/settings.route.test.ts`
- `apps/api/src/app.test.ts`
- `apps/api/src/routes/learning.route.test.ts`
- `apps/api/src/routes/progress.route.test.ts`

특히 `apps/admin-api`의 5개 테스트 파일은 `dashboardService`에 `AdminService` 전체 메서드를 매번 구현한다. 사용하지 않는 메서드는 대부분 `throw new Error("unexpected ... request")` 형태의 stub으로 채워져 있으며, 해당 패턴은 관리자 API 테스트에서 80개 확인되었다.

## 원인

`AdminApiDependencies`는 `dashboardService: AdminService`를 필수로 요구한다. `AdminService`는 현재 다음 15개 메서드를 가진다.

- `archiveCourse`
- `createCourse`
- `deleteUser`
- `getAnalytics`
- `getDashboard`
- `getLessonAnalytics`
- `getCourseEditor`
- `getCourses`
- `getSettings`
- `getUser`
- `getUsers`
- `resetContent`
- `updateLegalSettings`
- `updateNoticeSettings`
- `updateUserStatus`

따라서 특정 라우트 테스트가 실제로는 1-3개 메서드만 사용하더라도 타입을 만족시키기 위해 전체 service shape을 반복 작성해야 한다. 이 구조에서는 `AdminService`에 메서드가 추가될 때마다 여러 테스트 파일의 stub을 함께 수정해야 한다.

## 반례와 범위

`apps/api/src/routes/test-dependencies.ts`에는 이미 `createTestDependencies()`가 존재한다. `apps/api`의 여러 라우트 테스트는 이 헬퍼를 사용해 기본 의존성을 공유하고, 필요한 의존성만 spread override로 바꾼다.

따라서 이슈는 저장소 전체 테스트가 동일하게 나쁘다는 주장이라기보다, 관리자 API 테스트에 이미 적용된 패턴과 비슷한 테스트 의존성 factory가 없다는 문제로 보는 것이 정확하다.

## 구현 기록

- 구현 계획: `docs/superpowers/plans/2026-06-15-lol-27-test-dependency-factory.md`
- 작업 시작: 2026-06-15, `apps/admin-api` 테스트의 반복 `AdminApiDependencies` stub을 테스트 전용 factory로 축소한다.
- 완료 내용: `apps/admin-api/src/routes/test-dependencies.ts`에 기본 관리자 API 테스트 의존성 factory를 추가했다. 기존 관리자 API 라우트 테스트는 자신이 검증하는 `AdminService` 메서드만 override하도록 정리했다.
- 검증: `bun --filter @workspace/admin-api test`, `bun --filter @workspace/admin-api typecheck`, `bun --filter @workspace/admin-api lint`

## 권장 조치

우선순위는 `apps/admin-api`에 테스트 전용 의존성 factory를 추가하는 것이다.

- 예: `apps/admin-api/src/routes/test-dependencies.ts` 또는 `apps/admin-api/src/test/test-dependencies.ts`
- `createTestAdminApiDependencies(overrides?)` 형태로 기본 `AdminApiDependencies`를 반환한다.
- 기본 `adminService`는 모든 메서드를 명시적으로 실패시키는 fake를 제공한다.
- 각 테스트 파일은 자신이 검증하는 메서드만 override한다.
- `now`, `adminOrigin`, `sessionResolver`도 공통 기본값으로 둔다.

이 방식은 기존 `apps/api/src/routes/test-dependencies.ts`와 일관되고, 변경 범위도 관리자 API 테스트로 제한된다.

## 검증

- `bun --filter @workspace/admin-api test`: 통과, 7 files / 33 tests
- `bun --filter @workspace/api test`: 통과, 12 files / 27 tests
