import type {
  AdminAnalyticsDto,
  AdminDashboardDto,
} from "@workspace/contracts/admin/dashboard-analytics-data"
import { adminIdSchema } from "@workspace/contracts/admin"
import { userIdSchema } from "@workspace/contracts/admin/identity-data"
import type { AdminLessonAnalyticsPageDto } from "@workspace/contracts/admin/admin-analytics"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import {
  adminRoles,
  type ReadAdminLessonAnalyticsResult,
} from "@workspace/core/admin"

import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@/adapters/auth/admin-session"
import { createAdminApp } from "@/http/admin-app"
import { createAdminDashboardAnalyticsRoutes } from "@/modules/admin-dashboard-analytics/admin-dashboard-analytics.routes"

export type AdminDashboardAnalyticsTargetRouteFixtureJson =
  | null
  | boolean
  | number
  | string
  | readonly AdminDashboardAnalyticsTargetRouteFixtureJson[]
  | { readonly [key: string]: AdminDashboardAnalyticsTargetRouteFixtureJson }

export type AdminDashboardAnalyticsTargetRouteFixture = {
  readonly fetch: (request: Request) => Promise<Response> | Response
  readonly readEffectJournal: () => readonly AdminDashboardAnalyticsTargetRouteFixtureJson[]
}

const fixtureNow = new Date("2026-06-14T03:00:00.000Z")

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

export function createAdminDashboardAnalyticsTargetRouteFixture(
  scenario: string
): AdminDashboardAnalyticsTargetRouteFixture {
  const parsedScenario = parseScenario(scenario)
  const journal = createEffectJournal()
  const sessionResolver = createSessionResolver(parsedScenario)
  const capabilityRoutes = createAdminDashboardAnalyticsRoutes({
    analyticsReader: {
      async readAnalytics(input) {
        journal.record("analytics.read", {
          days: input.days,
          now: input.now.toISOString(),
        })

        return parsedScenario === "invalid-analytics"
          ? {
              ...analytics,
              dailySeries: [
                { completions: -1, date: "2026-06-13", signups: 0 },
              ],
            }
          : analytics
      },
      async readLessonAnalytics(input) {
        journal.record("analytics.lessons.read", {
          direction: input.direction,
          page: input.page,
          pageSize: input.pageSize,
          query: input.query,
          sort: input.sort,
        })

        return parsedScenario === "invalid-lesson-analytics"
          ? { ...lessonAnalyticsResult, page: 0 }
          : lessonAnalyticsResult
      },
    },
    dashboardReader: {
      async readDashboard(input) {
        journal.record("dashboard.read", { now: input.now.toISOString() })

        return parsedScenario === "invalid-dashboard"
          ? {
              ...dashboard,
              metrics: { ...dashboard.metrics, activeCourses: -1 },
            }
          : dashboard
      },
    },
    now: () => fixtureNow,
    sessionResolver,
  })
  const app = createAdminApp({ capabilityRoutes, sessionResolver })

  return {
    fetch(request) {
      return app.fetch(request)
    },
    readEffectJournal() {
      return journal.read()
    },
  }
}

function createSessionResolver(
  scenario: DashboardAnalyticsTargetScenario
): AdminSessionResolver {
  const session = {
    admin: {
      email: "admin@example.com",
      id: adminIdSchema.parse("admin-1"),
      name: "관리자",
      role: scenario === "operator" ? adminRoles.operator : adminRoles.owner,
    },
    [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
  } as const satisfies AdminAuthenticatedSession

  return {
    async resolveSession(headers) {
      return readAdminSessionToken(headers) === "admin-token" ? session : null
    },
  }
}

function readAdminSessionToken(headers: Headers): string | null {
  const cookies = headers.get("Cookie")
  if (cookies === null) return null

  const token = cookies
    .split(";")
    .map((cookie) => cookie.trim().split("=", 2))
    .find(([name]) => name === adminSessionCookieName)?.[1]

  return token === undefined ? null : decodeURIComponent(token)
}

function createEffectJournal() {
  const entries: AdminDashboardAnalyticsTargetRouteFixtureJson[] = []
  let sequence = 0

  return {
    record(
      effect: string,
      input: AdminDashboardAnalyticsTargetRouteFixtureJson
    ) {
      sequence += 1
      entries.push({ effect, input, sequence })
    },
    read() {
      return entries
    },
  }
}

type DashboardAnalyticsTargetScenario =
  | "default"
  | "invalid-analytics"
  | "invalid-dashboard"
  | "invalid-lesson-analytics"
  | "operator"

function parseScenario(scenario: string): DashboardAnalyticsTargetScenario {
  if (
    scenario === "default" ||
    scenario === "invalid-analytics" ||
    scenario === "invalid-dashboard" ||
    scenario === "invalid-lesson-analytics" ||
    scenario === "operator"
  ) {
    return scenario
  }

  throw new Error(
    `지원하지 않는 target dashboard·analytics target contract scenario입니다: ${scenario}`
  )
}
