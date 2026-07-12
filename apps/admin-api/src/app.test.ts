import { describe, expect, it, vi } from "vitest"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import { createApp, type AdminApiDependencies } from "@/app"
import { adminSessionExpiresAt } from "@/auth/admin-session"
import {
  createTestAdminApiDependencies,
  createTestAdminSessionResolver,
  testAdminSession,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminAnalyticsDto,
  AdminDashboardDto,
  AdminLessonAnalyticsPageDto,
  AdminUserDetailDto,
  AdminUserListDto,
} from "@workspace/contracts/admin"
import { adminIdSchema, userIdSchema } from "@workspace/contracts/admin"
import type { AdminRole } from "@workspace/core/admin"
import { adminRoles } from "@workspace/core/admin"

type CapturedRequestLogEvent = {
  readonly durationMs: number
  readonly method: string
  readonly path: string
  readonly requestId?: string
  readonly status: number
}

const adminId = adminIdSchema.parse("admin-1")
const userId = userIdSchema.parse("user-1")

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
      userId,
    },
  ],
}

const userList: AdminUserListDto = {
  items: [
    {
      email: "learner@example.com",
      id: userId,
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
  id: userId,
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
  it("유효한 관리자 세션 정보를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/session", {
      headers: {
        Cookie: "admin_session_token=admin-token",
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("Vary")).toContain("Cookie")
    await expect(response.json()).resolves.toEqual({
      admin: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
        role: "owner",
      },
      mfa: {
        enrollmentRequired: false,
        stepUpRequired: false,
      },
    })
  })

  it("신뢰하지 않은 Origin의 쿠키 인증 변경 요청을 side effect 전에 거절한다", async () => {
    const resetContent = vi.fn()
    const app = createApp(
      createTestAdminApiDependencies({
        adminServices: {
          contentReset: { resetContent },
        },
        sessionResolver: createDependencies().sessionResolver,
      })
    )

    const response = await app.request("/settings/content-reset", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: "https://attacker.example.test",
        "Sec-Fetch-Site": "same-site",
      },
      method: "POST",
    })

    expect(response.status).toBe(403)
    expect(resetContent).not.toHaveBeenCalled()
  })

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
    expect(response.headers.get("x-request-id")).not.toBe("admin-request-1")
    expect(requestEvents).toHaveLength(1)
    expect(requestEvents[0]).toMatchObject({
      method: "GET",
      path: "/dashboard",
      externalRequestId: "admin-request-1",
      requestId: response.headers.get("x-request-id"),
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

  it("관리자 API는 Google 로그인 전용 redirect helper를 제공하지 않는다", async () => {
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

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("Vary")).toContain("Cookie")
    expect(capturedRequests).toHaveLength(1)
    const capturedRequest = capturedRequests[0]
    if (capturedRequest === undefined) {
      throw new Error("Expected auth handler to receive the auth request")
    }

    expect(new URL(capturedRequest.url).pathname).toBe(
      "/api/auth/sign-in/google"
    )
  })

  it("관리자 비밀번호 변경은 요청값과 무관하게 다른 세션을 폐기한다", async () => {
    const capturedRequests: Request[] = []
    const app = createApp({
      ...createDependencies(),
      async authHandler(request) {
        capturedRequests.push(request)

        return Response.json({ status: true })
      },
    })

    const response = await app.request("/api/auth/change-password", {
      body: JSON.stringify({
        currentPassword: "old-password",
        newPassword: "new-password",
        revokeOtherSessions: false,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    const capturedRequest = capturedRequests[0]
    if (capturedRequest === undefined) {
      throw new Error("Expected auth handler to receive the auth request")
    }
    await expect(capturedRequest.json()).resolves.toEqual({
      currentPassword: "old-password",
      newPassword: "new-password",
      revokeOtherSessions: true,
    })
  })

  it("관리자 세션이 없으면 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/dashboard")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  })

  it.each([
    ["mfa-enrollment-required", "MFA_ENROLLMENT_REQUIRED"],
    ["mfa-step-up-required", "STEP_UP_REQUIRED"],
  ] as const)(
    "owner의 %s 세션은 민감 변경을 거부한다",
    async (authenticationAssurance, code) => {
      const app = createApp(
        createTestAdminApiDependencies({
          sessionResolver: createTestAdminSessionResolver({
            session: {
              ...testAdminSession,
              authenticationAssurance,
            },
          }),
        })
      )

      const response = await app.request("/settings/content-reset", {
        headers: {
          Cookie: "admin_session_token=admin-token",
          Origin: localRuntimeDefaults.adminWebOrigin,
        },
        method: "POST",
      })

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({
        code,
        message:
          code === "STEP_UP_REQUIRED"
            ? "Step-up authentication required"
            : "MFA enrollment required",
      })
    }
  )

  it("MFA 미등록 owner의 password activation 세션은 session과 등록 경로 외 콘솔 접근을 거부한다", async () => {
    const app = createApp(
      createTestAdminApiDependencies({
        sessionResolver: createTestAdminSessionResolver({
          session: {
            ...testAdminSession,
            authenticationAssurance: "mfa-enrollment-required",
            admin: {
              ...testAdminSession.admin,
              twoFactorEnabled: false,
            },
          },
        }),
      })
    )
    const headers = { Cookie: "admin_session_token=admin-token" }

    const sessionResponse = await app.request("/session", { headers })
    expect(sessionResponse.status).toBe(200)
    await expect(sessionResponse.json()).resolves.toMatchObject({
      mfa: { enrollmentRequired: true },
    })

    const dashboardResponse = await app.request("/dashboard", { headers })
    expect(dashboardResponse.status).toBe(403)
    await expect(dashboardResponse.json()).resolves.toMatchObject({
      code: "MFA_ENROLLMENT_REQUIRED",
    })
  })

  it("step-up이 만료된 owner는 사용자 삭제를 실행할 수 없다", async () => {
    const app = createApp(
      createTestAdminApiDependencies({
        sessionResolver: createTestAdminSessionResolver({
          session: {
            ...testAdminSession,
            authenticationAssurance: "mfa-step-up-required",
          },
        }),
      })
    )

    const response = await app.request("/users/user-1", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: localRuntimeDefaults.adminWebOrigin,
      },
      method: "DELETE",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({
      code: "STEP_UP_REQUIRED",
    })
  })

  it("Bearer 토큰만으로 관리자 보호 route에 접근할 수 없다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/dashboard", {
      headers: { Authorization: "Bearer admin-token" },
    })

    expect(response.status).toBe(401)
  })

  it("공개 health와 OpenAPI 응답에는 민감 응답 캐시 정책을 추가하지 않는다", async () => {
    const app = createApp(createDependencies())

    for (const path of ["/health", "/openapi"]) {
      const response = await app.request(path)

      expect(response.status).toBe(200)
      expect(response.headers.get("Cache-Control")).not.toBe(
        "private, no-store"
      )
    }
  })

  it("관리자 세션이 있으면 dashboard 지표를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/dashboard", {
      headers: {
        Cookie: "admin_session_token=admin-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(dashboard)
  })

  it("서비스 예외를 표준 500 오류 응답으로 변환한다", async () => {
    const dependencies = createDependencies()
    const errors: unknown[] = []
    const app = createApp({
      ...dependencies,
      errorLogger(event) {
        errors.push(event)
      },
      adminServices: {
        ...dependencies.adminServices,
        dashboard: {
          ...dependencies.adminServices.dashboard,
          async getDashboard() {
            throw new Error("database unavailable")
          },
        },
      },
      requestLogger() {},
      requestLoggingRuntime: {
        createRequestId: () => "admin-error-request-id",
        readMonotonicTimeMs: () => 0,
      },
    })

    const response = await app.request("/dashboard", {
      headers: {
        Cookie: "admin_session_token=admin-token",
      },
    })

    expect(response.status).toBe(500)
    expect(response.headers.get("x-request-id")).toBe("admin-error-request-id")
    expect(errors).toEqual([
      expect.objectContaining({
        errorClass: "Error",
        requestId: "admin-error-request-id",
        status: 500,
      }),
    ])
    expect(JSON.stringify(errors)).not.toContain("database unavailable")
    await expect(response.json()).resolves.toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    })
  })
})

describe("어드민 API analytics route", () => {
  it("관리자 세션이 없으면 분석 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/analytics")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  })

  it("관리자 세션이 있으면 분석 기간 query를 파싱해 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/analytics?days=2", {
      headers: {
        Cookie: "admin_session_token=admin-token",
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
          Cookie: "admin_session_token=admin-token",
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
          Cookie: "admin_session_token=admin-token",
        },
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
    })
  })
})

describe("어드민 API users route", () => {
  it("관리자 세션이 없으면 사용자 목록 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/users")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  })

  it("관리자 세션이 있으면 사용자 목록 query를 파싱해 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request(
      "/users?page=1&pageSize=12&query=%ED%95%99%EC%8A%B5&status=active&sort=lastActive",
      {
        headers: {
          Cookie: "admin_session_token=admin-token",
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
        Cookie: "admin_session_token=admin-token",
      },
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
    })
  })

  it("사용자 상세, 상태 변경, 삭제 상태 전환을 제공한다", async () => {
    const app = createApp(createDependencies())
    const headers = {
      Cookie: "admin_session_token=admin-token",
      Origin: localRuntimeDefaults.adminWebOrigin,
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
        Cookie: "admin_session_token=admin-token",
        "Content-Type": "application/json",
        Origin: localRuntimeDefaults.adminWebOrigin,
      },
      method: "PATCH",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
    })
  })

  it("운영자는 사용자 상태 변경과 삭제를 실행할 수 없다", async () => {
    const app = createApp(createDependencies({ role: adminRoles.operator }))
    const headers = {
      Cookie: "admin_session_token=admin-token",
      Origin: localRuntimeDefaults.adminWebOrigin,
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
      code: "FORBIDDEN",
      message: "Forbidden",
    })

    const deleteResponse = await app.request("/users/user-1", {
      headers,
      method: "DELETE",
    })

    expect(deleteResponse.status).toBe(403)
    await expect(deleteResponse.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message: "Forbidden",
    })
  })
})

function createDependencies({
  role = adminRoles.owner,
}: {
  readonly role?: AdminRole
} = {}): AdminApiDependencies {
  return createTestAdminApiDependencies({
    adminServices: {
      analytics: {
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
      dashboard: {
        async getDashboard() {
          return dashboard
        },
      },
      users: {
        async deleteUser(input) {
          expect(input.userId).toBe("user-1")
          expect(input.actor).toEqual({
            authenticationAssurance:
              role === adminRoles.owner ? "mfa-step-up-verified" : "password",
            id: adminId,
            role,
          })
          return { kind: "ok", value: { deleted: true } }
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
          expect(input.actor).toEqual({
            authenticationAssurance:
              role === adminRoles.owner ? "mfa-step-up-verified" : "password",
            id: adminId,
            role,
          })

          return {
            kind: "ok",
            value: { ...userDetail, status: "suspended" },
          }
        },
      },
    },
    sessionResolver: {
      async resolveSession(headers) {
        const token = readTestAdminSessionToken(headers)

        if (token !== "admin-token") {
          return null
        }

        return {
          admin: {
            email: "admin@example.com",
            id: adminId,
            name: "관리자",
            role,
            twoFactorEnabled: role === adminRoles.owner,
          },
          authenticationAssurance:
            role === adminRoles.owner ? "mfa-step-up-verified" : "password",
          [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
        }
      },
    },
  })
}

function readTestAdminSessionToken(headers: Headers): string | null {
  const cookieToken = headers
    .get("Cookie")
    ?.split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === "admin_session_token")?.[1]

  if (cookieToken !== undefined) {
    return decodeURIComponent(cookieToken)
  }

  return null
}
