import { describe, expect, it } from "vitest"
import { localRuntimeDefaults } from "@workspace/env"

import { createApp, type AdminApiDependencies } from "@/app"
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

type CapturedRequestLogEvent = {
  readonly durationMs: number
  readonly method: string
  readonly path: string
  readonly requestId?: string
  readonly status: number
}

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
  recentActivities: [
    {
      currentStreakDays: 3,
      email: "learner@example.com",
      lastActiveDate: "2026-06-14",
      name: "학습자",
      userId: "user-1",
    },
  ],
}

const userList: AdminUserListDto = {
  items: [
    {
      email: "learner@example.com",
      id: "user-1",
      joined: "2026-06-01",
      lastActive: "2026-06-14",
      lessonsDone: 3,
      name: "학습자",
      status: "active",
      streak: 2,
    },
  ],
  pagination: {
    page: 1,
    pageSize: 12,
    totalItems: 1,
    totalPages: 1,
  },
}

const userDetail: AdminUserDetailDto = {
  email: "learner@example.com",
  id: "user-1",
  joined: "2026-06-01",
  lastActive: "2026-06-14",
  lessonsDone: 3,
  name: "학습자",
  progressPercent: 30,
  status: "active",
  streak: 2,
  totalLessons: 10,
}

const analytics: AdminAnalyticsDto = {
  dailySeries: [
    {
      completions: 1,
      date: "2026-06-13",
      signups: 0,
    },
    {
      completions: 2,
      date: "2026-06-14",
      signups: 1,
    },
  ],
  streakBuckets: [
    {
      count: 1,
      label: "0일",
    },
    {
      count: 2,
      label: "1-3일",
    },
    {
      count: 0,
      label: "4-7일",
    },
    {
      count: 0,
      label: "8-14일",
    },
    {
      count: 0,
      label: "15일+",
    },
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

const lessonAnalytics: AdminLessonAnalyticsPageDto = {
  items: [
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
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1,
  },
}

describe("어드민 API dashboard route", () => {
  it("요청 완료 로그에 request id와 응답 상태를 남긴다", async () => {
    const requestEvents: CapturedRequestLogEvent[] = []
    const app = createApp({
      ...createDependencies(),
      requestLogger(event) {
        requestEvents.push(event)
      },
    })

    const response = await app.request("/dashboard", {
      headers: {
        "X-Request-ID": "admin-request-1",
      },
    })

    expect(response.status).toBe(401)
    expect(response.headers.get("x-request-id")).toBe("admin-request-1")
    expect(requestEvents).toHaveLength(1)
    expect(requestEvents[0]).toMatchObject({
      method: "GET",
      path: "/dashboard",
      requestId: "admin-request-1",
      status: 401,
    })
    expect(requestEvents[0]?.durationMs).toBeGreaterThanOrEqual(0)
  })

  it("운영 설정 저장 preflight에서 PUT method를 허용한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings/notice", {
      headers: {
        "Access-Control-Request-Headers": "Authorization, Content-Type",
        "Access-Control-Request-Method": "PUT",
        Origin: localRuntimeDefaults.adminWebOrigin,
      },
      method: "OPTIONS",
    })

    expect(response.status).toBe(204)
    expect(response.headers.get("access-control-allow-methods")).toContain(
      "PUT"
    )
  })

  it("기존 Google 로그인 시작 경로를 Better Auth social sign-in으로 위임한다", async () => {
    const capturedRequests: Request[] = []
    const app = createApp({
      ...createDependencies(),
      async authHandler(request) {
        capturedRequests.push(request)

        return Response.json({
          redirect: true,
          url: "https://accounts.google.com/o/oauth2/v2/auth",
        })
      },
    })

    const response = await app.request(
      "/api/auth/sign-in/google?callbackURL=%2F"
    )

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth"
    )
    const capturedRequest = capturedRequests[0]

    expect(capturedRequest?.method).toBe("POST")
    expect(new URL(capturedRequest?.url ?? "").pathname).toBe(
      "/api/auth/sign-in/social"
    )
    await expect(capturedRequest?.json()).resolves.toEqual({
      callbackURL: "/",
      provider: "google",
    })
  })

  it("관리자 세션이 없으면 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/dashboard")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
      },
    })
  })

  it("관리자 세션이 있으면 dashboard 지표를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/dashboard", {
      headers: {
        Authorization: "Bearer admin-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(dashboard)
  })

  it("서비스 예외를 표준 500 오류 응답으로 변환한다", async () => {
    const dependencies = createDependencies()
    const app = createApp({
      ...dependencies,
      dashboardService: {
        ...dependencies.dashboardService,
        async getDashboard() {
          throw new Error("database unavailable")
        },
      },
    })

    const response = await app.request("/dashboard", {
      headers: {
        Authorization: "Bearer admin-token",
      },
    })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "internal_error",
      },
    })
  })
})

describe("어드민 API analytics route", () => {
  it("관리자 세션이 없으면 분석 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/analytics")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
      },
    })
  })

  it("관리자 세션이 있으면 분석 기간 query를 파싱해 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/analytics?days=2", {
      headers: {
        Authorization: "Bearer admin-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(analytics)
  })

  it("레슨별 분석 query를 파싱해 검색, 정렬, 페이지네이션 결과를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request(
      "/analytics/lessons?page=1&pageSize=10&query=%EB%91%98%EC%A7%B8&sort=completionRate&direction=asc",
      {
        headers: {
          Authorization: "Bearer admin-token",
        },
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(lessonAnalytics)
  })

  it("허용하지 않는 분석 query는 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request(
      "/analytics/lessons?direction=sideways",
      {
        headers: {
          Authorization: "Bearer admin-token",
        },
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
      },
    })
  })
})

describe("어드민 API users route", () => {
  it("관리자 세션이 없으면 사용자 목록 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/users")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
      },
    })
  })

  it("관리자 세션이 있으면 사용자 목록 query를 파싱해 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request(
      "/users?page=1&pageSize=12&query=%ED%95%99%EC%8A%B5&status=active&sort=lastActive",
      {
        headers: {
          Authorization: "Bearer admin-token",
        },
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(userList)
  })

  it("사용자 목록 페이지 크기 query가 상한을 넘으면 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/users?pageSize=101", {
      headers: {
        Authorization: "Bearer admin-token",
      },
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
      },
    })
  })

  it("사용자 상세, 상태 변경, 삭제 상태 전환을 제공한다", async () => {
    const app = createApp(createDependencies())
    const headers = {
      Authorization: "Bearer admin-token",
    }

    const detailResponse = await app.request("/users/user-1", { headers })

    expect(detailResponse.status).toBe(200)
    await expect(detailResponse.json()).resolves.toEqual(userDetail)

    const statusResponse = await app.request("/users/user-1/status", {
      body: JSON.stringify({ status: "suspended" }),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })

    expect(statusResponse.status).toBe(200)
    await expect(statusResponse.json()).resolves.toEqual({
      ...userDetail,
      status: "suspended",
    })

    const deleteResponse = await app.request("/users/user-1", {
      headers,
      method: "DELETE",
    })

    expect(deleteResponse.status).toBe(200)
    await expect(deleteResponse.json()).resolves.toEqual({ deleted: true })
  })

  it("허용하지 않는 사용자 상태 변경은 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/users/user-1/status", {
      body: JSON.stringify({ status: "deleted" }),
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
      },
    })
  })

  it("운영자는 사용자 상태 변경과 삭제를 실행할 수 없다", async () => {
    const app = createApp(createDependencies({ role: "operator" }))
    const headers = {
      Authorization: "Bearer admin-token",
    }

    const statusResponse = await app.request("/users/user-1/status", {
      body: JSON.stringify({ status: "suspended" }),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })

    expect(statusResponse.status).toBe(403)
    await expect(statusResponse.json()).resolves.toEqual({
      error: {
        code: "forbidden",
      },
    })

    const deleteResponse = await app.request("/users/user-1", {
      headers,
      method: "DELETE",
    })

    expect(deleteResponse.status).toBe(403)
    await expect(deleteResponse.json()).resolves.toEqual({
      error: {
        code: "forbidden",
      },
    })
  })
})

function createDependencies({
  role = "owner",
}: {
  readonly role?: "operator" | "owner"
} = {}): AdminApiDependencies {
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
    sessionResolver: {
      async resolveSession(token) {
        if (token !== "admin-token") {
          return null
        }

        return {
          admin: {
            email: "admin@example.com",
            id: "admin-1",
            name: "관리자",
            role,
          },
        }
      },
    },
  })
}
