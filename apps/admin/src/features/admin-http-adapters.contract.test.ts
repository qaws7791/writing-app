import { describe, expect, it } from "vitest"

import { createAdminHttpTransport } from "@/lib/api/admin-http-transport"
import { createAdminSessionApi } from "@/features/auth/admin-session-api"
import { createAdminAnalyticsApi } from "@/features/analytics/admin-analytics-api"
import { createAdminAiChatApi } from "@/features/chat/admin-ai-chat-api"
import { createAdminCoursesApi } from "@/features/courses/admin-courses-api"
import { createAdminDashboardApi } from "@/features/dashboard/admin-dashboard-api"
import { createAdminSettingsApi } from "@/features/settings/admin-settings-api"
import { createAdminUsersApi } from "@/features/users/admin-users-api"
import type { AdminApiBaseUrl } from "@/runtime-config"
import type { HttpFetch } from "@workspace/http-client"
import { readAdminApiBaseUrl } from "@/runtime-config"

describe("관리자 feature HTTP Adapter 계약", () => {
  it("서버 요청에 검증된 Origin을 명시하고 세션 응답을 파싱한다", async () => {
    let capturedRequest: Request | undefined
    const api = createTestAdminApis({
      baseUrl: readAdminApiBaseUrl({
        ADMIN_API_BASE_URL: "https://admin-api.example.test/",
      }),
      fetch: async (request) => {
        capturedRequest = request
        return jsonResponse({
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
      },
      requestOrigin: "https://admin.example.test/path",
      tokenProvider: () => "admin-token",
    })

    await expect(api.getSession()).resolves.toMatchObject({
      status: "ok",
      value: { admin: { id: "admin-1", role: "owner" } },
    })
    expect(capturedRequest?.headers.get("Origin")).toBe(
      "https://admin.example.test"
    )
  })

  it("대시보드, 코스, 사용자, 분석, 설정 endpoint를 Better Auth 쿠키와 함께 호출한다", async () => {
    const requests: Request[] = []
    const bodies: unknown[] = []
    const api = createTestAdminApis({
      baseUrl: readAdminApiBaseUrl({
        ADMIN_API_BASE_URL: "https://admin-api.example.test/",
      }),
      fetch: async (request) => {
        requests.push(request)

        if (request.headers.has("Content-Type")) {
          bodies.push(await request.json())
        }

        return jsonResponse(responseFor(request))
      },
      tokenProvider: () => "admin-token",
    })

    await expect(api.getDashboard()).resolves.toMatchObject({
      status: "ok",
      value: {
        metrics: {
          totalUsers: 12,
        },
      },
    })
    await expect(
      api.getCourses({
        category: "입문자를 위한 코스",
        page: 2,
        pageSize: 10,
        query: "글쓰기",
        status: "active",
      })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        items: [
          {
            id: "c1",
            title: "글쓰기 첫걸음 30일",
          },
        ],
      },
    })
    await expect(api.createCourse()).resolves.toMatchObject({
      status: "ok",
      value: {
        id: "new-course",
      },
    })
    await expect(api.archiveCourse("c1")).resolves.toEqual({
      status: "ok",
      value: {
        archived: true,
      },
    })
    await expect(
      api.getUsers({
        page: 1,
        pageSize: 20,
        query: "민지",
        sort: "lastActive",
        status: "all",
      })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        items: [
          {
            id: "user-1",
            name: "민지",
          },
        ],
      },
    })
    await expect(api.getUser("user-1")).resolves.toMatchObject({
      status: "ok",
      value: {
        id: "user-1",
        progressPercent: 35,
      },
    })
    await expect(
      api.updateUserStatus({
        status: "suspended",
        userId: "user-1",
      })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        status: "suspended",
      },
    })
    await expect(api.deleteUser("user-1")).resolves.toEqual({
      status: "ok",
      value: {
        deleted: true,
      },
    })
    await expect(api.getAnalytics({ days: 30 })).resolves.toMatchObject({
      status: "ok",
      value: {
        streakBuckets: [
          {
            label: "1-3일",
          },
        ],
      },
    })
    await expect(
      api.getLessonAnalytics({
        direction: "asc",
        page: 1,
        pageSize: 10,
        query: "문장",
        sort: "completionRate",
      })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        items: [
          {
            lessonId: "l1",
          },
        ],
      },
    })
    await expect(api.getSettings()).resolves.toMatchObject({
      status: "ok",
      value: {
        notice: {
          banner: "오늘의 공지",
        },
      },
    })
    await expect(
      api.saveNoticeSettings({
        announce: "공지 본문",
        banner: "오늘의 공지",
      })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        notice: {
          announce: "공지 본문",
        },
      },
    })
    await expect(
      api.saveLegalSettings({
        privacy: "개인정보처리방침",
        terms: "이용약관",
      })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        legal: {
          terms: "이용약관",
        },
      },
    })
    await expect(api.resetContent()).resolves.toMatchObject({
      status: "ok",
      value: {
        revision: 4,
      },
    })

    expect(requests.map((request) => [request.method, request.url])).toEqual([
      ["GET", "https://admin-api.example.test/dashboard"],
      [
        "GET",
        "https://admin-api.example.test/courses?category=%EC%9E%85%EB%AC%B8%EC%9E%90%EB%A5%BC+%EC%9C%84%ED%95%9C+%EC%BD%94%EC%8A%A4&page=2&pageSize=10&query=%EA%B8%80%EC%93%B0%EA%B8%B0&status=active",
      ],
      ["POST", "https://admin-api.example.test/courses"],
      ["DELETE", "https://admin-api.example.test/courses/c1"],
      [
        "GET",
        "https://admin-api.example.test/users?page=1&pageSize=20&query=%EB%AF%BC%EC%A7%80&sort=lastActive&status=all",
      ],
      ["GET", "https://admin-api.example.test/users/user-1"],
      ["PATCH", "https://admin-api.example.test/users/user-1/status"],
      ["DELETE", "https://admin-api.example.test/users/user-1"],
      ["GET", "https://admin-api.example.test/analytics?days=30"],
      [
        "GET",
        "https://admin-api.example.test/analytics/lessons?direction=asc&page=1&pageSize=10&query=%EB%AC%B8%EC%9E%A5&sort=completionRate",
      ],
      ["GET", "https://admin-api.example.test/settings"],
      ["PUT", "https://admin-api.example.test/settings/notice"],
      ["PUT", "https://admin-api.example.test/settings/legal"],
      ["POST", "https://admin-api.example.test/settings/content-reset"],
    ])
    expect(requests[0]?.headers.get("Cookie")).toBe(
      "admin_session_token=admin-token"
    )
    expect(requests[0]?.headers.has("Authorization")).toBe(false)
    expect(requests[0]?.credentials).toBe("include")
    expect(bodies).toEqual([
      {
        status: "suspended",
      },
      {
        announce: "공지 본문",
        banner: "오늘의 공지",
      },
      {
        privacy: "개인정보처리방침",
        terms: "이용약관",
      },
      {},
    ])
  })

  it("실패 응답을 AdminApi 오류로 변환한다", async () => {
    const api = createTestAdminApis({
      baseUrl: readAdminApiBaseUrl({
        ADMIN_API_BASE_URL: "https://admin-api.example.test",
      }),
      fetch: async () =>
        jsonResponse(
          {
            code: "NOT_FOUND",
            message: "Not Found",
          },
          404
        ),
      tokenProvider: () => null,
    })

    await expect(api.getUser("missing-user")).resolves.toEqual({
      error: {
        code: "not-found",
        message: "요청한 항목을 찾을 수 없습니다.",
        status: 404,
      },
      status: "error",
    })
  })

  it("권한 실패 응답을 AdminApi 권한 오류로 변환한다", async () => {
    const api = createTestAdminApis({
      baseUrl: readAdminApiBaseUrl({
        ADMIN_API_BASE_URL: "https://admin-api.example.test",
      }),
      fetch: async () =>
        jsonResponse(
          {
            code: "FORBIDDEN",
            message: "Forbidden",
          },
          403
        ),
      tokenProvider: () => "admin-token",
    })

    await expect(api.resetContent()).resolves.toEqual({
      error: {
        code: "forbidden",
        message: "관리자 권한이 필요합니다.",
        status: 403,
      },
      status: "error",
    })
  })

  it("성공 응답이 계약과 다르면 contract-error를 반환한다", async () => {
    const api = createTestAdminApis({
      baseUrl: readAdminApiBaseUrl({
        ADMIN_API_BASE_URL: "https://admin-api.example.test",
      }),
      fetch: async () =>
        jsonResponse({
          metrics: {
            totalUsers: "12",
          },
          recentActivities: [],
        }),
      tokenProvider: () => "admin-token",
    })

    await expect(api.getDashboard()).resolves.toEqual({
      error: {
        code: "contract-error",
        message: "API 응답을 해석할 수 없습니다.",
        status: 200,
      },
      status: "error",
    })
  })

  it("fetch 예외를 원인이 보존된 네트워크 오류로 반환한다", async () => {
    const cause = new TypeError("Network unreachable")
    const api = createTestAdminApis({
      baseUrl: readAdminApiBaseUrl({
        ADMIN_API_BASE_URL: "https://admin-api.example.test",
      }),
      fetch: async () => {
        throw cause
      },
      tokenProvider: () => "admin-token",
    })

    await expect(
      api.getUsers({
        page: 1,
        pageSize: 20,
        query: "민지",
        sort: "lastActive",
        status: "all",
      })
    ).resolves.toEqual({
      error: {
        code: "network-error",
        message: "네트워크 연결을 확인해 주세요.",
        network: {
          cause,
          code: "network-error",
          kind: "failed",
          method: "GET",
          url: "https://admin-api.example.test/users",
        },
      },
      status: "error",
    })
  })
})

function createTestAdminApis(input: {
  readonly baseUrl: AdminApiBaseUrl
  readonly fetch: HttpFetch
  readonly requestOrigin?: string
  readonly tokenProvider: () => Promise<string | null> | string | null
}) {
  const transport = createAdminHttpTransport(input)
  return {
    ...createAdminSessionApi(transport),
    ...createAdminAnalyticsApi(transport),
    ...createAdminAiChatApi(transport),
    ...createAdminCoursesApi(transport),
    ...createAdminDashboardApi(transport),
    ...createAdminSettingsApi(transport),
    ...createAdminUsersApi(transport),
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  })
}

function responseFor(request: Request): unknown {
  if (request.url.endsWith("/dashboard")) {
    return {
      metrics: {
        activeCourses: 5,
        activeLessons: 44,
        activeUsersLast7Days: 8,
        completedLessons: 72,
        signupsLast7Days: 3,
        signupsToday: 1,
        totalUsers: 12,
      },
      recentActivities: [],
    }
  }

  if (request.method === "GET" && request.url.includes("/courses?")) {
    return {
      items: [
        {
          category: "입문자를 위한 코스",
          id: "c1",
          lessonCount: 10,
          revision: 3,
          status: "active",
          title: "글쓰기 첫걸음 30일",
          unitCount: 3,
          visualKey: "basic-sentence-writing",
        },
      ],
      pagination: {
        page: 2,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      },
    }
  }

  if (request.method === "POST" && request.url.endsWith("/courses")) {
    return courseDetail("new-course")
  }

  if (request.method === "DELETE" && request.url.endsWith("/courses/c1")) {
    return {
      archived: true,
    }
  }

  if (request.url.includes("/users?")) {
    return {
      items: [userListItem("active")],
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      },
    }
  }

  if (request.method === "GET" && request.url.endsWith("/users/user-1")) {
    return {
      ...userListItem("active"),
      progressPercent: 35,
      totalLessons: 44,
    }
  }

  if (request.method === "PATCH") {
    return {
      ...userListItem("suspended"),
      progressPercent: 35,
      totalLessons: 44,
    }
  }

  if (request.method === "DELETE" && request.url.endsWith("/users/user-1")) {
    return {
      deleted: true,
    }
  }

  if (request.url.endsWith("/analytics?days=30")) {
    return {
      dailySeries: [
        {
          completions: 2,
          date: "2026-06-14",
          signups: 1,
        },
      ],
      streakBuckets: [
        {
          count: 4,
          label: "1-3일",
        },
      ],
      worstLessons: [],
    }
  }

  if (request.url.includes("/analytics/lessons?")) {
    return {
      items: [lessonAnalytics()],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      },
    }
  }

  if (request.url.endsWith("/settings")) {
    return settings()
  }

  if (request.url.endsWith("/settings/notice")) {
    return settings({
      announce: "공지 본문",
      banner: "오늘의 공지",
    })
  }

  if (request.url.endsWith("/settings/legal")) {
    return settings(undefined, {
      privacy: "개인정보처리방침",
      terms: "이용약관",
    })
  }

  if (request.url.endsWith("/settings/content-reset")) {
    return {
      changed: {
        archived: 0,
        courses: 5,
        lessons: 44,
        steps: 136,
        units: 15,
      },
      revision: 4,
    }
  }

  throw new Error(`Unexpected request ${request.method} ${request.url}`)
}

function userListItem(status: "active" | "suspended") {
  return {
    email: "minji@example.com",
    id: "user-1",
    joined: "2026-06-01",
    lastActive: "2026-06-14",
    lessonsDone: 12,
    name: "민지",
    status,
    streak: 5,
  }
}

function lessonAnalytics() {
  return {
    completed: 7,
    completionRate: 70,
    courseId: "c1",
    courseTitle: "글쓰기 첫걸음 30일",
    dropOffRate: 30,
    lessonId: "l1",
    lessonTitle: "문장 시작하기",
    started: 10,
  }
}

function settings(
  notice = {
    announce: "",
    banner: "오늘의 공지",
  },
  legal = {
    privacy: "",
    terms: "",
  }
) {
  return {
    legal,
    notice,
  }
}

function courseDetail(id: string) {
  return {
    category: "미분류",
    description: "강의 설명",
    id,
    revision: 1,
    status: "active",
    title: "새 강의",
    units: [],
  }
}
