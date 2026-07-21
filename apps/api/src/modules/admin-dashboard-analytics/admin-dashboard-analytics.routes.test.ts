import { describe, expect, it, vi } from "vitest"
import type {
  AdminAnalyticsDto,
  AdminDashboardDto,
} from "@workspace/contracts/admin/dashboard-analytics-data"
import { adminIdSchema } from "@workspace/contracts/admin"
import { userIdSchema } from "@workspace/contracts/admin/identity-data"
import type { AdminLessonAnalyticsPageDto } from "@workspace/contracts/admin/admin-analytics"
import {
  adminRoles,
  type ReadAdminLessonAnalyticsResult,
} from "@workspace/core/admin"

import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@workspace/auth/admin/server"
import { createAdminApp } from "@/http/admin-app"
import { createAdminDashboardAnalyticsRoutes } from "@/modules/admin-dashboard-analytics/admin-dashboard-analytics.routes"

const testNow = new Date("2026-06-14T03:00:00.000Z")
const adminCookie = "admin_session_token=admin-token"

const dashboard: AdminDashboardDto = {
  metrics: {
    activeCourses: 1,
    activeLessons: 2,
    activeUsersLast7Days: 3,
    completedLessons: 4,
    signupsLast7Days: 5,
    signupsToday: 1,
    totalUsers: 6,
  },
  recentActivities: [
    {
      currentStreakDays: 2,
      email: "learner@example.com",
      lastActiveDate: "2026-06-14",
      name: "학습자",
      userId: userIdSchema.parse("user-1"),
    },
  ],
}

const analytics: AdminAnalyticsDto = {
  dailySeries: [
    { completions: 1, date: "2026-06-13", signups: 0 },
    { completions: 2, date: "2026-06-14", signups: 1 },
  ],
  streakBuckets: [
    { count: 1, label: "0일" },
    { count: 2, label: "1-3일" },
    { count: 0, label: "4-7일" },
    { count: 0, label: "8-14일" },
    { count: 0, label: "15일+" },
  ],
  worstLessons: [
    {
      completed: 1,
      completionRate: 50,
      courseId: "course-1",
      courseTitle: "활성 코스",
      dropOffRate: 50,
      lessonId: "lesson-2",
      lessonTitle: "둘째 레슨",
      started: 2,
    },
  ],
}

const lessonAnalyticsResponse: AdminLessonAnalyticsPageDto = {
  items: analytics.worstLessons,
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1,
  },
}

const lessonAnalyticsResult: ReadAdminLessonAnalyticsResult = {
  items: lessonAnalyticsResponse.items,
  page: lessonAnalyticsResponse.pagination.page,
  pageSize: lessonAnalyticsResponse.pagination.pageSize,
  totalItems: lessonAnalyticsResponse.pagination.totalItems,
  totalPages: lessonAnalyticsResponse.pagination.totalPages,
}

describe("통합 관리자 dashboard·analytics route", () => {
  it("dashboard read-side snapshot과 private cache 정책을 보존한다", async () => {
    const { app, readDashboard } = createTestApp()

    const response = await app.request("/dashboard", {
      headers: { Cookie: adminCookie },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    await expect(response.json()).resolves.toEqual(dashboard)
    expect(readDashboard).toHaveBeenCalledWith({ now: testNow })
  })

  it("세션 없이 read route에 접근하면 reader를 호출하지 않는다", async () => {
    const { app, readAnalytics, readDashboard, readLessonAnalytics } =
      createTestApp()

    const response = await app.request("/analytics")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
    expect(readDashboard).not.toHaveBeenCalled()
    expect(readAnalytics).not.toHaveBeenCalled()
    expect(readLessonAnalytics).not.toHaveBeenCalled()
  })

  it("analytics 기간과 레슨 목록 query를 기존 계약으로 parser와 reader에 전달한다", async () => {
    const { app, readAnalytics, readLessonAnalytics } = createTestApp()
    const headers = { Cookie: adminCookie }

    const [summaryResponse, lessonsResponse] = await Promise.all([
      app.request("/analytics?days=2", { headers }),
      app.request(
        "/analytics/lessons?page=1&pageSize=10&query=%EB%91%98%EC%A7%B8&sort=completionRate&direction=asc",
        { headers }
      ),
    ])

    expect(summaryResponse.status).toBe(200)
    await expect(summaryResponse.json()).resolves.toEqual(analytics)
    expect(readAnalytics).toHaveBeenCalledWith({ days: 2, now: testNow })
    expect(lessonsResponse.status).toBe(200)
    await expect(lessonsResponse.json()).resolves.toEqual(
      lessonAnalyticsResponse
    )
    expect(readLessonAnalytics).toHaveBeenCalledWith({
      direction: "asc",
      page: 1,
      pageSize: 10,
      query: "둘째",
      sort: "completionRate",
    })
  })

  it("query 상한과 enum 검증 오류는 reader 호출 전에 400으로 격리한다", async () => {
    const { app, readAnalytics, readLessonAnalytics } = createTestApp()
    const headers = { Cookie: adminCookie }

    const [daysResponse, pageSizeResponse, directionResponse] =
      await Promise.all([
        app.request("/analytics?days=366", { headers }),
        app.request("/analytics/lessons?pageSize=101", { headers }),
        app.request("/analytics/lessons?direction=sideways", { headers }),
      ])

    for (const response of [
      daysResponse,
      pageSizeResponse,
      directionResponse,
    ]) {
      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        code: "VALIDATION_FAILED",
        message: "Request validation failed",
      })
    }
    expect(readAnalytics).not.toHaveBeenCalled()
    expect(readLessonAnalytics).not.toHaveBeenCalled()
  })

  it("read-side 응답 schema 위반은 내부 오류로 redaction한다", async () => {
    const dashboardApp = createTestApp({ invalidDashboard: true }).app
    const analyticsApp = createTestApp({ invalidAnalytics: true }).app
    const lessonAnalyticsApp = createTestApp({
      invalidLessonAnalytics: true,
    }).app
    const headers = { Cookie: adminCookie }

    const responses = await Promise.all([
      dashboardApp.request("/dashboard", { headers }),
      analyticsApp.request("/analytics?days=2", { headers }),
      lessonAnalyticsApp.request("/analytics/lessons", { headers }),
    ])

    for (const response of responses) {
      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toEqual({
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal Server Error",
      })
    }
  })

  it("OpenAPI에 세 read operation과 cookie security scheme을 등록한다", async () => {
    const { app } = createTestApp()

    const response = await app.request("/openapi")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      components: {
        securitySchemes: {
          adminSessionCookie: {
            in: "cookie",
            name: "admin_session_token",
            type: "apiKey",
          },
        },
      },
      paths: {
        "/api/admin/analytics": { get: { operationId: "getAdminAnalytics" } },
        "/api/admin/analytics/lessons": {
          get: { operationId: "getAdminLessonAnalytics" },
        },
        "/api/admin/dashboard": { get: { operationId: "getAdminDashboard" } },
      },
    })
  })
})

function createTestApp({
  invalidAnalytics = false,
  invalidDashboard = false,
  invalidLessonAnalytics = false,
}: {
  readonly invalidAnalytics?: boolean
  readonly invalidDashboard?: boolean
  readonly invalidLessonAnalytics?: boolean
} = {}) {
  const readDashboard = vi.fn(async () =>
    invalidDashboard
      ? { ...dashboard, metrics: { ...dashboard.metrics, activeCourses: -1 } }
      : dashboard
  )
  const readAnalytics = vi.fn(async () =>
    invalidAnalytics
      ? {
          ...analytics,
          dailySeries: [{ completions: -1, date: "2026-06-13", signups: 0 }],
        }
      : analytics
  )
  const readLessonAnalytics = vi.fn(async () =>
    invalidLessonAnalytics
      ? { ...lessonAnalyticsResult, page: 0 }
      : lessonAnalyticsResult
  )
  const sessionResolver = createTestAdminSessionResolver()
  const capabilityRoutes = createAdminDashboardAnalyticsRoutes({
    analyticsReader: {
      readAnalytics,
      readLessonAnalytics,
    },
    dashboardReader: { readDashboard },
    now: () => testNow,
    sessionResolver,
  })

  return {
    app: createAdminApp({ capabilityRoutes, sessionResolver }),
    readAnalytics,
    readDashboard,
    readLessonAnalytics,
  }
}

function createTestAdminSessionResolver(): AdminSessionResolver {
  const session = {
    admin: {
      email: "admin@example.com",
      id: adminIdSchema.parse("admin-1"),
      name: "관리자",
      role: adminRoles.owner,
    },
    [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
  } as const satisfies AdminAuthenticatedSession

  return {
    async resolveSession(headers) {
      return headers.get("Cookie") === adminCookie ? session : null
    },
  }
}
