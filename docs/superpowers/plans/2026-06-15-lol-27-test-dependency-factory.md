# LOL-27 Test Dependency Factory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/admin-api` 테스트에서 반복 작성 중인 `AdminApiDependencies` 전체 stub을 테스트 전용 factory로 모아, 각 테스트 파일이 검증 대상 메서드 override만 선언하도록 만든다.

**Architecture:** `apps/admin-api/src/routes/test-dependencies.ts`가 관리자 API 테스트 기본 의존성을 소유한다. 기본 `AdminService` fake는 모든 메서드를 명시적으로 실패시키고, 테스트는 필요한 메서드만 `Partial<AdminService>`로 override한다. 기존 `apps/api/src/routes/test-dependencies.ts` 패턴과 같은 위치와 import 방식을 사용해 변경 범위를 관리자 API 테스트에 한정한다.

**Tech Stack:** Bun 1.3.10, TypeScript 5.9, Vitest 4, Hono, `@workspace/core` admin service 타입.

---

## 파일 구조

- Create: `apps/admin-api/src/routes/test-dependencies.ts`
  - 관리자 API 테스트 기본 의존성 factory다.
  - `adminOrigin`, 고정 `now`, 기본 관리자 세션 resolver, 실패 기본값을 가진 `AdminService` fake를 제공한다.
- Create: `apps/admin-api/src/routes/test-dependencies.test.ts`
  - factory가 기본 세션과 고정 시간을 제공하고, 필요한 service 메서드만 override할 수 있음을 검증한다.
- Modify: `apps/admin-api/src/routes/analytics.route.test.ts`
  - 전체 `AdminApiDependencies` stub을 제거하고 analytics 관련 service override만 남긴다.
- Modify: `apps/admin-api/src/routes/courses.route.test.ts`
  - courses 관련 service override만 남긴다.
- Modify: `apps/admin-api/src/routes/curriculum-editor.route.test.ts`
  - curriculum editor 관련 service override만 남긴다.
- Modify: `apps/admin-api/src/routes/settings.route.test.ts`
  - settings 관련 service override만 남긴다.
- Modify: `apps/admin-api/src/app.test.ts`
  - 통합 라우트 테스트에서 실제 사용하는 admin service 메서드 override만 남긴다.
- Modify: `docs/linear-lol-27-test-dependency-duplication-research.md`
  - 작업 시작과 완료 기록을 한국어로 남긴다.

---

### Task 1: 문서에 구현 시작 기록

**Files:**

- Modify: `docs/linear-lol-27-test-dependency-duplication-research.md`

- [ ] **Step 1: 구현 기록 섹션을 추가한다**

`docs/linear-lol-27-test-dependency-duplication-research.md`의 `## 권장 조치` 섹션 앞에 다음 섹션을 추가한다.

```markdown
## 구현 기록

- 구현 계획: `docs/superpowers/plans/2026-06-15-lol-27-test-dependency-factory.md`
- 작업 시작: 2026-06-15, `apps/admin-api` 테스트의 반복 `AdminApiDependencies` stub을 테스트 전용 factory로 축소한다.
```

- [ ] **Step 2: 문서 diff를 확인한다**

Run:

```bash
git diff -- docs/linear-lol-27-test-dependency-duplication-research.md
```

Expected: `## 구현 기록` 섹션 추가만 보인다.

- [ ] **Step 3: 시작 문서를 커밋한다**

```bash
git add docs/linear-lol-27-test-dependency-duplication-research.md
git commit -m "docs: LOL-27 테스트 의존성 정리 시작"
```

Expected: 한국어 커밋 메시지로 문서 시작 기록만 커밋된다.

---

### Task 2: 테스트 의존성 factory의 기대 동작을 먼저 고정

**Files:**

- Create: `apps/admin-api/src/routes/test-dependencies.test.ts`

- [ ] **Step 1: 실패하는 factory 테스트를 추가한다**

`apps/admin-api/src/routes/test-dependencies.test.ts`를 다음 내용으로 만든다.

```ts
import { describe, expect, it } from "vitest"
import type { AdminDashboardDto } from "@workspace/core/admin"

import {
  createTestAdminApiDependencies,
  testAdminNow,
  testAdminSession,
} from "@/routes/test-dependencies"

const dashboard: AdminDashboardDto = {
  metrics: {
    activeCourses: 5,
    activeLessons: 44,
    activeUsersLast7Days: 2,
    completedLessons: 3,
    signupsLast7Days: 2,
    signupsToday: 1,
    totalUsers: 3,
  },
  recentActivities: [],
}

describe("어드민 API 테스트 의존성", () => {
  it("기본 관리자 세션과 고정 시간을 제공한다", async () => {
    const dependencies = createTestAdminApiDependencies()

    expect(dependencies.adminOrigin).toBe("http://localhost:3003")
    expect(dependencies.now?.()).toEqual(testAdminNow)
    await expect(
      dependencies.sessionResolver.resolveSession("admin-token")
    ).resolves.toEqual(testAdminSession)
    await expect(
      dependencies.sessionResolver.resolveSession("missing-token")
    ).resolves.toBeNull()
  })

  it("테스트에서 필요한 admin service 메서드만 override한다", async () => {
    const dependencies = createTestAdminApiDependencies({
      dashboardService: {
        async getDashboard(input) {
          expect(input).toEqual({ now: testAdminNow })

          return dashboard
        },
      },
    })

    await expect(
      dependencies.dashboardService.getDashboard({ now: testAdminNow })
    ).resolves.toEqual(dashboard)
    await expect(dependencies.dashboardService.getSettings()).rejects.toThrow(
      "Unexpected admin service call: getSettings"
    )
  })
})
```

- [ ] **Step 2: 테스트가 helper 부재로 실패하는지 확인한다**

Run:

```bash
bun --filter @workspace/admin-api test src/routes/test-dependencies.test.ts
```

Expected: FAIL. `@/routes/test-dependencies` 모듈을 찾을 수 없다는 오류가 나온다.

- [ ] **Step 3: 실패 테스트를 커밋한다**

```bash
git add apps/admin-api/src/routes/test-dependencies.test.ts
git commit -m "test: 어드민 API 테스트 의존성 factory 기대 동작 추가"
```

Expected: 실패 테스트만 커밋된다.

---

### Task 3: 관리자 API 테스트 의존성 factory 구현

**Files:**

- Create: `apps/admin-api/src/routes/test-dependencies.ts`
- Test: `apps/admin-api/src/routes/test-dependencies.test.ts`

- [ ] **Step 1: 테스트 의존성 factory를 구현한다**

`apps/admin-api/src/routes/test-dependencies.ts`를 다음 내용으로 만든다.

```ts
import type { AdminApiDependencies } from "@/app"
import type {
  AdminAuthenticatedSession,
  AdminSessionResolver,
} from "@/auth/admin-session"
import type { AdminService } from "@workspace/core/admin"

type TestAdminApiDependencyOverrides = {
  readonly adminOrigin?: string
  readonly dashboardService?: Partial<AdminService>
  readonly now?: () => Date
  readonly sessionResolver?: AdminSessionResolver
}

export const testAdminNow = new Date("2026-06-14T03:00:00.000Z")

export const testAdminSession = {
  admin: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
    role: "owner",
  },
} as const satisfies AdminAuthenticatedSession

export function createTestAdminApiDependencies(
  overrides: TestAdminApiDependencyOverrides = {}
): AdminApiDependencies {
  return {
    adminOrigin: overrides.adminOrigin ?? "http://localhost:3003",
    dashboardService: {
      ...createFailingAdminService(),
      ...overrides.dashboardService,
    },
    now: overrides.now ?? (() => testAdminNow),
    sessionResolver:
      overrides.sessionResolver ?? createTestAdminSessionResolver(),
  }
}

export function createTestAdminSessionResolver({
  activeToken = "admin-token",
  session = testAdminSession,
}: {
  readonly activeToken?: string
  readonly session?: AdminAuthenticatedSession
} = {}): AdminSessionResolver {
  return {
    async resolveSession(token) {
      return token === activeToken ? session : null
    },
  }
}

function createFailingAdminService(): AdminService {
  return {
    async archiveCourse() {
      throwUnexpectedAdminServiceCall("archiveCourse")
    },
    async createCourse() {
      throwUnexpectedAdminServiceCall("createCourse")
    },
    async deleteUser() {
      throwUnexpectedAdminServiceCall("deleteUser")
    },
    async getAnalytics() {
      throwUnexpectedAdminServiceCall("getAnalytics")
    },
    async getCourseEditor() {
      throwUnexpectedAdminServiceCall("getCourseEditor")
    },
    async getCourses() {
      throwUnexpectedAdminServiceCall("getCourses")
    },
    async getDashboard() {
      throwUnexpectedAdminServiceCall("getDashboard")
    },
    async getLessonAnalytics() {
      throwUnexpectedAdminServiceCall("getLessonAnalytics")
    },
    async getSettings() {
      throwUnexpectedAdminServiceCall("getSettings")
    },
    async getUser() {
      throwUnexpectedAdminServiceCall("getUser")
    },
    async getUsers() {
      throwUnexpectedAdminServiceCall("getUsers")
    },
    async resetContent() {
      throwUnexpectedAdminServiceCall("resetContent")
    },
    async updateLegalSettings() {
      throwUnexpectedAdminServiceCall("updateLegalSettings")
    },
    async updateNoticeSettings() {
      throwUnexpectedAdminServiceCall("updateNoticeSettings")
    },
    async updateUserStatus() {
      throwUnexpectedAdminServiceCall("updateUserStatus")
    },
  }
}

function throwUnexpectedAdminServiceCall(
  methodName: keyof AdminService
): never {
  throw new Error(`Unexpected admin service call: ${methodName}`)
}
```

- [ ] **Step 2: factory 테스트가 통과하는지 확인한다**

Run:

```bash
bun --filter @workspace/admin-api test src/routes/test-dependencies.test.ts
```

Expected: PASS. `2 passed`가 보인다.

- [ ] **Step 3: 타입체크로 `Partial<AdminService>` 병합 타입을 확인한다**

Run:

```bash
bun --filter @workspace/admin-api typecheck
```

Expected: PASS. `createTestAdminApiDependencies()` 반환값이 `AdminApiDependencies`와 호환된다.

- [ ] **Step 4: factory 구현을 커밋한다**

```bash
git add apps/admin-api/src/routes/test-dependencies.ts
git commit -m "test: 어드민 API 테스트 의존성 factory 추가"
```

Expected: helper 구현 파일만 커밋된다.

---

### Task 4: analytics route 테스트를 service override 중심으로 축소

**Files:**

- Modify: `apps/admin-api/src/routes/analytics.route.test.ts`
- Test: `apps/admin-api/src/routes/analytics.route.test.ts`

- [ ] **Step 1: import를 factory 기준으로 바꾼다**

`apps/admin-api/src/routes/analytics.route.test.ts` 상단 import를 다음처럼 정리한다.

```ts
import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import {
  createTestAdminApiDependencies,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminAnalyticsDto,
  AdminLessonAnalyticsPageDto,
} from "@workspace/core/admin"
```

- [ ] **Step 2: 파일 하단 `createDependencies()`를 override만 남긴 함수로 바꾼다**

기존 `function createDependencies(): AdminApiDependencies { ... }` 전체를 다음 코드로 교체한다.

```ts
function createDependencies() {
  return createTestAdminApiDependencies({
    dashboardService: {
      async getAnalytics(input) {
        expect(input).toEqual({
          days: 2,
          now: testAdminNow,
        })

        return analytics
      },
      async getLessonAnalytics(input) {
        expect(input).toEqual({
          direction: "asc",
          page: 1,
          pageSize: 10,
          query: "둘째",
          sort: "completionRate",
        })

        return lessonAnalytics
      },
    },
  })
}
```

- [ ] **Step 3: route 테스트를 실행한다**

Run:

```bash
bun --filter @workspace/admin-api test src/routes/analytics.route.test.ts
```

Expected: PASS. analytics route 테스트 4개가 통과한다.

- [ ] **Step 4: 중복 제거를 검색으로 확인한다**

Run:

```bash
rg -n "unexpected .*request|AdminApiDependencies|new Date\\(\"2026-06-14T03:00:00.000Z\"\\)" apps/admin-api/src/routes/analytics.route.test.ts
```

Expected: 검색 결과가 없다.

- [ ] **Step 5: analytics 테스트 정리를 커밋한다**

```bash
git add apps/admin-api/src/routes/analytics.route.test.ts
git commit -m "test: 어드민 분석 라우트 의존성 중복 제거"
```

Expected: analytics route 테스트 파일만 커밋된다.

---

### Task 5: curriculum editor route 테스트를 service override 중심으로 축소

**Files:**

- Modify: `apps/admin-api/src/routes/curriculum-editor.route.test.ts`
- Test: `apps/admin-api/src/routes/curriculum-editor.route.test.ts`

- [ ] **Step 1: import를 factory 기준으로 바꾼다**

`apps/admin-api/src/routes/curriculum-editor.route.test.ts` 상단 import를 다음처럼 정리한다.

```ts
import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import { createTestAdminApiDependencies } from "@/routes/test-dependencies"
import type { AdminCourseDetailDto } from "@workspace/core/admin"
```

- [ ] **Step 2: 파일 하단 `createDependencies()`를 override만 남긴 함수로 바꾼다**

기존 `function createDependencies(): AdminApiDependencies { ... }` 전체를 다음 코드로 교체한다.

```ts
function createDependencies() {
  return createTestAdminApiDependencies({
    dashboardService: {
      async getCourseEditor(input) {
        if (input.courseId === "missing") {
          return null
        }

        expect(input.courseId).toBe("cmock")
        return courseDetail
      },
    },
  })
}
```

- [ ] **Step 3: route 테스트를 실행한다**

Run:

```bash
bun --filter @workspace/admin-api test src/routes/curriculum-editor.route.test.ts
```

Expected: PASS. curriculum editor route 테스트 3개가 통과한다.

- [ ] **Step 4: 중복 제거를 검색으로 확인한다**

Run:

```bash
rg -n "unexpected .*request|AdminApiDependencies|resolveSession" apps/admin-api/src/routes/curriculum-editor.route.test.ts
```

Expected: 검색 결과가 없다.

- [ ] **Step 5: curriculum editor 테스트 정리를 커밋한다**

```bash
git add apps/admin-api/src/routes/curriculum-editor.route.test.ts
git commit -m "test: 어드민 커리큘럼 라우트 의존성 중복 제거"
```

Expected: curriculum editor route 테스트 파일만 커밋된다.

---

### Task 6: courses route 테스트를 service override 중심으로 축소

**Files:**

- Modify: `apps/admin-api/src/routes/courses.route.test.ts`
- Test: `apps/admin-api/src/routes/courses.route.test.ts`

- [ ] **Step 1: import를 factory 기준으로 바꾼다**

`apps/admin-api/src/routes/courses.route.test.ts` 상단 import를 다음처럼 정리한다.

```ts
import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import {
  createTestAdminApiDependencies,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminArchiveCourseResultDto,
  AdminCourseDetailDto,
  AdminCourseListDto,
} from "@workspace/core/admin"
```

- [ ] **Step 2: 파일 하단 `createDependencies()`를 override만 남긴 함수로 바꾼다**

기존 `function createDependencies(): AdminApiDependencies { ... }` 전체를 다음 코드로 교체한다.

```ts
function createDependencies() {
  return createTestAdminApiDependencies({
    dashboardService: {
      async archiveCourse(input) {
        expect(input.now).toEqual(testAdminNow)

        if (input.courseId === "missing") {
          return null
        }

        expect(input.courseId).toBe("cmock")
        return archiveCourseResult
      },
      async createCourse(input) {
        expect(input.now).toEqual(testAdminNow)
        return courseDetail
      },
      async getCourses(input) {
        expect(input).toEqual({
          category: "입문자를 위한 코스",
          page: 2,
          pageSize: 10,
          query: "글쓰기",
          status: "active",
        })

        return courseList
      },
    },
  })
}
```

- [ ] **Step 3: route 테스트를 실행한다**

Run:

```bash
bun --filter @workspace/admin-api test src/routes/courses.route.test.ts
```

Expected: PASS. courses route 테스트 6개가 통과한다.

- [ ] **Step 4: 중복 제거를 검색으로 확인한다**

Run:

```bash
rg -n "unexpected .*request|AdminApiDependencies|new Date\\(\"2026-06-14T03:00:00.000Z\"\\)" apps/admin-api/src/routes/courses.route.test.ts
```

Expected: 검색 결과가 없다.

- [ ] **Step 5: courses 테스트 정리를 커밋한다**

```bash
git add apps/admin-api/src/routes/courses.route.test.ts
git commit -m "test: 어드민 코스 라우트 의존성 중복 제거"
```

Expected: courses route 테스트 파일만 커밋된다.

---

### Task 7: settings route 테스트를 service override 중심으로 축소

**Files:**

- Modify: `apps/admin-api/src/routes/settings.route.test.ts`
- Test: `apps/admin-api/src/routes/settings.route.test.ts`

- [ ] **Step 1: import를 factory 기준으로 바꾼다**

`apps/admin-api/src/routes/settings.route.test.ts` 상단 import를 다음처럼 정리한다.

```ts
import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import {
  createTestAdminApiDependencies,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminContentResetResultDto,
  AdminSettingsDto,
} from "@workspace/core/admin"
```

- [ ] **Step 2: 파일 하단 `createDependencies()`를 override만 남긴 함수로 바꾼다**

기존 `function createDependencies(): AdminApiDependencies { ... }` 전체를 다음 코드로 교체한다.

```ts
function createDependencies() {
  return createTestAdminApiDependencies({
    dashboardService: {
      async getSettings() {
        return settings
      },
      async resetContent(input) {
        expect(input.now).toEqual(testAdminNow)
        return contentResetResult
      },
      async updateLegalSettings(input) {
        expect(input).toEqual({
          now: testAdminNow,
          privacy: "개인정보처리방침",
          terms: "이용약관",
        })

        return settings
      },
      async updateNoticeSettings(input) {
        expect(input).toEqual({
          announce: "공지 내용",
          banner: "새 강의가 추가되었어요!",
          now: testAdminNow,
        })

        return settings
      },
    },
  })
}
```

- [ ] **Step 3: route 테스트를 실행한다**

Run:

```bash
bun --filter @workspace/admin-api test src/routes/settings.route.test.ts
```

Expected: PASS. settings route 테스트 6개가 통과한다.

- [ ] **Step 4: 중복 제거를 검색으로 확인한다**

Run:

```bash
rg -n "unexpected .*request|AdminApiDependencies|AdminAnalyticsDto|AdminDashboardDto|AdminLessonAnalyticsPageDto|AdminUserDetailDto|AdminUserListDto|new Date\\(\"2026-06-14T03:00:00.000Z\"\\)" apps/admin-api/src/routes/settings.route.test.ts
```

Expected: 검색 결과가 없다.

- [ ] **Step 5: settings 테스트 정리를 커밋한다**

```bash
git add apps/admin-api/src/routes/settings.route.test.ts
git commit -m "test: 어드민 설정 라우트 의존성 중복 제거"
```

Expected: settings route 테스트 파일만 커밋된다.

---

### Task 8: admin app 통합 테스트를 service override 중심으로 축소

**Files:**

- Modify: `apps/admin-api/src/app.test.ts`
- Test: `apps/admin-api/src/app.test.ts`

- [ ] **Step 1: import를 factory 기준으로 바꾼다**

`apps/admin-api/src/app.test.ts` 상단 import를 다음처럼 정리한다.

```ts
import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import {
  createTestAdminApiDependencies,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminAnalyticsDto,
  AdminDashboardDto,
  AdminLessonAnalyticsPageDto,
  AdminUserDetailDto,
  AdminUserListDto,
} from "@workspace/core/admin"
```

- [ ] **Step 2: 파일 하단 `createDependencies()`를 override만 남긴 함수로 바꾼다**

기존 `function createDependencies(): AdminApiDependencies { ... }` 전체를 다음 코드로 교체한다.

```ts
function createDependencies() {
  return createTestAdminApiDependencies({
    dashboardService: {
      async deleteUser(input) {
        expect(input.userId).toBe("user-1")
        return { deleted: true }
      },
      async getAnalytics(input) {
        expect(input).toEqual({
          days: 2,
          now: testAdminNow,
        })

        return analytics
      },
      async getDashboard() {
        return dashboard
      },
      async getLessonAnalytics(input) {
        expect(input).toEqual({
          direction: "asc",
          page: 1,
          pageSize: 10,
          query: "둘째",
          sort: "completionRate",
        })

        return lessonAnalytics
      },
      async getUser(input) {
        expect(input.userId).toBe("user-1")
        return userDetail
      },
      async getUsers(input) {
        expect(input).toEqual({
          page: 1,
          pageSize: 12,
          query: "학습",
          sort: "lastActive",
          status: "active",
        })

        return userList
      },
      async updateUserStatus(input) {
        expect(input.status).toBe("suspended")
        expect(input.userId).toBe("user-1")

        return {
          ...userDetail,
          status: "suspended",
        }
      },
    },
  })
}
```

- [ ] **Step 3: app 테스트를 실행한다**

Run:

```bash
bun --filter @workspace/admin-api test src/app.test.ts
```

Expected: PASS. app 테스트 11개가 통과한다.

- [ ] **Step 4: 중복 제거를 검색으로 확인한다**

Run:

```bash
rg -n "unexpected .*request|AdminApiDependencies|resolveSession|new Date\\(\"2026-06-14T03:00:00.000Z\"\\)" apps/admin-api/src/app.test.ts
```

Expected: 검색 결과가 없다.

- [ ] **Step 5: app 테스트 정리를 커밋한다**

```bash
git add apps/admin-api/src/app.test.ts
git commit -m "test: 어드민 앱 테스트 의존성 중복 제거"
```

Expected: app 테스트 파일만 커밋된다.

---

### Task 9: 관리자 API 테스트 전체에서 중복 패턴 제거를 검증

**Files:**

- Test: `apps/admin-api/src/**/*.test.ts`

- [ ] **Step 1: 관리자 API 테스트 전체를 실행한다**

Run:

```bash
bun --filter @workspace/admin-api test
```

Expected: PASS. 최소 `8 passed` test files와 기존 33개 테스트에 factory 테스트 2개가 더해진 `35 passed` tests가 보인다.

- [ ] **Step 2: 관리자 API 타입체크를 실행한다**

Run:

```bash
bun --filter @workspace/admin-api typecheck
```

Expected: PASS.

- [ ] **Step 3: 관리자 API lint를 실행한다**

Run:

```bash
bun --filter @workspace/admin-api lint
```

Expected: PASS.

- [ ] **Step 4: 반복 stub 잔여량을 확인한다**

Run:

```bash
rg -n "unexpected .*request|throw new Error\\(\"unexpected|function createDependencies\\(\\): AdminApiDependencies" apps/admin-api/src --glob "*.test.ts"
```

Expected: 검색 결과가 없다.

- [ ] **Step 5: helper 사용 위치를 확인한다**

Run:

```bash
rg -n "createTestAdminApiDependencies" apps/admin-api/src --glob "*.test.ts"
```

Expected: 다음 6개 테스트 파일에서 사용된다.

```text
apps/admin-api/src/app.test.ts
apps/admin-api/src/routes/analytics.route.test.ts
apps/admin-api/src/routes/courses.route.test.ts
apps/admin-api/src/routes/curriculum-editor.route.test.ts
apps/admin-api/src/routes/settings.route.test.ts
apps/admin-api/src/routes/test-dependencies.test.ts
```

- [ ] **Step 6: 검증 상태를 커밋한다**

```bash
git status --short
```

Expected: 커밋되지 않은 코드 변경이 없다. 문서 완료 기록만 다음 Task에서 남긴다.

---

### Task 10: 문서 완료 기록과 최종 검증

**Files:**

- Modify: `docs/linear-lol-27-test-dependency-duplication-research.md`

- [ ] **Step 1: 구현 기록 섹션을 완료 상태로 갱신한다**

`docs/linear-lol-27-test-dependency-duplication-research.md`의 `## 구현 기록` 섹션을 다음 내용으로 바꾼다.

```markdown
## 구현 기록

- 구현 계획: `docs/superpowers/plans/2026-06-15-lol-27-test-dependency-factory.md`
- 작업 시작: 2026-06-15, `apps/admin-api` 테스트의 반복 `AdminApiDependencies` stub을 테스트 전용 factory로 축소한다.
- 완료 내용: `apps/admin-api/src/routes/test-dependencies.ts`에 기본 관리자 API 테스트 의존성 factory를 추가했다. 기존 관리자 API 라우트 테스트는 자신이 검증하는 `AdminService` 메서드만 override하도록 정리했다.
- 검증: `bun --filter @workspace/admin-api test`, `bun --filter @workspace/admin-api typecheck`, `bun --filter @workspace/admin-api lint`
```

- [ ] **Step 2: 문서 형식을 확인한다**

Run:

```bash
bunx prettier --check docs/linear-lol-27-test-dependency-duplication-research.md docs/superpowers/plans/2026-06-15-lol-27-test-dependency-factory.md
```

Expected: PASS. 두 문서 모두 Prettier 형식을 만족한다.

- [ ] **Step 3: pre-commit 검증을 실행한다**

Run:

```bash
bun lefthook run pre-commit
```

Expected: PASS. 저장소 pre-commit 훅이 통과한다.

- [ ] **Step 4: 완료 문서를 커밋한다**

```bash
git add docs/linear-lol-27-test-dependency-duplication-research.md
git commit -m "docs: LOL-27 테스트 의존성 정리 완료"
```

Expected: 문서 완료 기록만 커밋된다.

- [ ] **Step 5: 최종 작업 트리를 확인한다**

Run:

```bash
git status --short
```

Expected: LOL-27 작업으로 인한 미커밋 변경이 없다. 작업 시작 전부터 존재하던 사용자 변경은 되돌리지 않는다.

---

## Self-Review

- Spec coverage: Linear LOL-27의 핵심인 테스트 의존성 중복 제거는 Task 2~9에서 처리한다. `AdminService` 메서드 추가 시 여러 테스트 파일을 수정해야 하는 문제는 Task 3의 실패 기본 fake와 `Partial<AdminService>` override 구조로 완화한다. 문서 시작/완료 갱신은 Task 1과 Task 10에 포함했다.
- Placeholder scan: 빈칸, 미정 항목, 나중 구현 지시, 모호한 오류 처리 지시를 남기지 않았다. 각 코드 변경 단계는 파일 경로와 교체할 코드 블록을 포함한다.
- Type consistency: `createTestAdminApiDependencies()`는 `AdminApiDependencies`를 반환하고, override 타입은 `Partial<AdminService>`로 고정한다. 시간 fixture는 모든 테스트에서 `testAdminNow`를 사용하며, 기본 세션 fixture는 `AdminAuthenticatedSession`을 만족한다.
