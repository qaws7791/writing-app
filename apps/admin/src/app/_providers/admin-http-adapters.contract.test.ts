import { describe, expect, it } from "vitest"

import { createAdminHttpTransport } from "@/shared/http/admin-http-transport"
import { createAdminSessionDal } from "@/features/authentication/server/admin-session-dal"
import { createAdminAnalyticsDal } from "@/features/analytics/server/admin-analytics-dal"
import { createAdminAiChatDal } from "@/features/ai-chat/server/admin-ai-chat-dal"
import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"
import { createAdminCourseEditorApi } from "@/features/course-editor/api/admin-course-editor-api"
import { createAdminCourseCatalogDal } from "@/features/course-catalog/server/admin-course-catalog-dal"
import { createAdminDashboardDal } from "@/features/dashboard/server/admin-dashboard-dal"
import { createAdminContentMaintenanceDal } from "@/features/content-maintenance/server/admin-content-maintenance-dal"
import { createAdminUsersDal } from "@/features/user-management/server/admin-users-dal"
import type { ApiBaseUrl } from "@/shared/config/admin-runtime-config"
import type { HttpFetch } from "@workspace/http-client/json-transport"
import { readApiBaseUrl } from "@/shared/config/admin-runtime-config"
import { userIdSchema } from "@/entities/learner-account/model/learner-account-id"
import { courseIdSchema } from "@/entities/course/model/course-id"

const userId = userIdSchema.parse("user-1")
const courseId = courseIdSchema.parse("c1")

describe("관리자 feature HTTP Adapter 계약", () => {
  it("서버 요청에 검증된 Origin을 명시하고 세션 응답을 파싱한다", async () => {
    let capturedRequest: Request | undefined
    const api = createTestAdminApis({
      baseUrl: readApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test/",
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
      baseUrl: readApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test/",
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
    const editor = adminCourseEditorSchema.parse(courseDetail("c1"))
    await expect(api.saveCourseEditor(courseId, editor)).resolves.toEqual({
      status: "ok",
      value: editor,
    })
    await expect(api.publishCourse(courseId, editor)).resolves.toMatchObject({
      status: "ok",
      value: { revision: 1 },
    })
    await expect(api.archiveCourse(courseId)).resolves.toEqual({
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
    await expect(api.getUser(userId)).resolves.toMatchObject({
      status: "ok",
      value: {
        id: "user-1",
        progressPercent: 35,
      },
    })
    await expect(
      api.updateUserStatus({
        status: "suspended",
        userId,
      })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        status: "suspended",
      },
    })
    await expect(api.deleteUser(userId)).resolves.toEqual({
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
    await expect(api.resetContent()).resolves.toMatchObject({
      status: "ok",
      value: {
        revision: 4,
      },
    })

    expect(requests.map((request) => [request.method, request.url])).toEqual([
      ["GET", "https://api.example.test/api/admin/dashboard"],
      [
        "GET",
        "https://api.example.test/api/admin/courses?category=%EC%9E%85%EB%AC%B8%EC%9E%90%EB%A5%BC+%EC%9C%84%ED%95%9C+%EC%BD%94%EC%8A%A4&page=2&pageSize=10&query=%EA%B8%80%EC%93%B0%EA%B8%B0&status=active",
      ],
      ["POST", "https://api.example.test/api/admin/courses"],
      ["PUT", "https://api.example.test/api/admin/courses/c1/editor"],
      ["POST", "https://api.example.test/api/admin/courses/c1/publish"],
      ["DELETE", "https://api.example.test/api/admin/courses/c1"],
      [
        "GET",
        "https://api.example.test/api/admin/users?page=1&pageSize=20&query=%EB%AF%BC%EC%A7%80&sort=lastActive&status=all",
      ],
      ["GET", "https://api.example.test/api/admin/users/user-1"],
      ["PATCH", "https://api.example.test/api/admin/users/user-1/status"],
      ["DELETE", "https://api.example.test/api/admin/users/user-1"],
      ["GET", "https://api.example.test/api/admin/analytics?days=30"],
      [
        "GET",
        "https://api.example.test/api/admin/analytics/lessons?direction=asc&page=1&pageSize=10&query=%EB%AC%B8%EC%9E%A5&sort=completionRate",
      ],
      ["POST", "https://api.example.test/api/admin/maintenance/content-reset"],
    ])
    expect(requests[0]?.headers.get("Cookie")).toBe(
      "admin_session_token=admin-token"
    )
    expect(requests[0]?.headers.has("Authorization")).toBe(false)
    expect(requests[0]?.credentials).toBe("include")
    expect(requests[3]?.headers.get("If-Match")).toBe('"0"')
    expect(requests[4]?.headers.get("If-Match")).toBe('"0"')
    expect(bodies).toEqual([
      courseDetail("c1"),
      {
        status: "suspended",
      },
      {},
    ])
  })

  it("실패 응답을 AdminApi 오류로 변환한다", async () => {
    const api = createTestAdminApis({
      baseUrl: readApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
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

    await expect(
      api.getUser(userIdSchema.parse("missing-user"))
    ).resolves.toEqual({
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
      baseUrl: readApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
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
      baseUrl: readApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
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
      baseUrl: readApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
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
          url: "https://api.example.test/api/admin/users",
        },
      },
      status: "error",
    })
  })
})

function createTestAdminApis(input: {
  readonly baseUrl: ApiBaseUrl
  readonly fetch: HttpFetch
  readonly requestOrigin?: string
  readonly tokenProvider: () => Promise<string | null> | string | null
}) {
  const transport = createAdminHttpTransport(input)
  return {
    ...createAdminSessionDal(transport),
    ...createAdminAnalyticsDal(transport),
    ...createAdminAiChatDal(transport),
    ...createAdminCourseCatalogDal(transport),
    ...createAdminCourseEditorApi(transport),
    ...createAdminDashboardDal(transport),
    ...createAdminContentMaintenanceDal(transport),
    ...createAdminUsersDal(transport),
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

  if (request.method === "PUT" && request.url.endsWith("/courses/c1/editor")) {
    return courseDetail("c1")
  }

  if (
    request.method === "POST" &&
    request.url.endsWith("/courses/c1/publish")
  ) {
    return {
      curriculumVersionId: "c1-v1",
      publishedAt: "2026-07-17T00:00:00.000Z",
      revision: 1,
    }
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

  if (request.url.endsWith("/maintenance/content-reset")) {
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

function courseDetail(id: string) {
  return {
    category: "미분류",
    curriculumVersionId: `${id}-v1`,
    description: "강의 설명",
    editVersion: 0,
    id,
    revision: 1,
    status: "active",
    title: "새 강의",
    units: [],
  }
}
