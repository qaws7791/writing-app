import { networkAdminApiError, toAdminApiError } from "@/lib/api/api-error"
import {
  adminApiError,
  adminApiOk,
  type AdminApiResult,
} from "@/lib/api/api-result"
import type {
  AdminApi,
  ReadAdminAnalyticsInput,
  ReadAdminCoursesInput,
  ReadAdminLessonAnalyticsInput,
  ReadAdminUsersInput,
  UpdateAdminUserStatusInput,
} from "@/lib/api/admin-api"

export type AdminFetchLike = (request: Request) => Promise<Response>
export type AdminTokenProvider = () => Promise<string | null> | string | null

export function createHttpAdminApi({
  baseUrl,
  fetch,
  tokenProvider,
}: {
  readonly baseUrl: string
  readonly fetch: AdminFetchLike
  readonly tokenProvider: AdminTokenProvider
}): AdminApi {
  const client = createAdminHttpClient({
    baseUrl,
    fetch,
    tokenProvider,
  })

  return {
    archiveCourse(courseId) {
      return client.requestJson({
        method: "DELETE",
        path: `/courses/${courseId}`,
      })
    },
    createCourse() {
      return client.requestJson({
        method: "POST",
        path: "/courses",
      })
    },
    deleteUser(userId) {
      return client.requestJson({
        method: "DELETE",
        path: `/users/${userId}`,
      })
    },
    getAnalytics(input) {
      return client.requestJson({
        method: "GET",
        path: `/analytics?${analyticsSearchParams(input)}`,
      })
    },
    getCourses(input) {
      return client.requestJson({
        method: "GET",
        path: `/courses?${coursesSearchParams(input)}`,
      })
    },
    getCourseEditor(courseId) {
      return client.requestJson({
        method: "GET",
        path: `/courses/${courseId}/editor`,
      })
    },
    getDashboard() {
      return client.requestJson({
        method: "GET",
        path: "/dashboard",
      })
    },
    getLessonAnalytics(input) {
      return client.requestJson({
        method: "GET",
        path: `/analytics/lessons?${lessonAnalyticsSearchParams(input)}`,
      })
    },
    getSettings() {
      return client.requestJson({
        method: "GET",
        path: "/settings",
      })
    },
    getUser(userId) {
      return client.requestJson({
        method: "GET",
        path: `/users/${userId}`,
      })
    },
    getUsers(input) {
      return client.requestJson({
        method: "GET",
        path: `/users?${usersSearchParams(input)}`,
      })
    },
    resetContent() {
      return client.requestJson({
        body: {},
        method: "POST",
        path: "/settings/content-reset",
      })
    },
    saveLegalSettings(input) {
      return client.requestJson({
        body: input,
        method: "PUT",
        path: "/settings/legal",
      })
    },
    saveNoticeSettings(input) {
      return client.requestJson({
        body: input,
        method: "PUT",
        path: "/settings/notice",
      })
    },
    updateUserStatus(input: UpdateAdminUserStatusInput) {
      return client.requestJson({
        body: {
          status: input.status,
        },
        method: "PATCH",
        path: `/users/${input.userId}/status`,
      })
    },
  }
}

function createAdminHttpClient({
  baseUrl,
  fetch,
  tokenProvider,
}: {
  readonly baseUrl: string
  readonly fetch: AdminFetchLike
  readonly tokenProvider: AdminTokenProvider
}): {
  readonly requestJson: <TValue>(input: {
    readonly body?: unknown
    readonly method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT"
    readonly path: string
  }) => Promise<AdminApiResult<TValue>>
} {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "")

  return {
    async requestJson<TValue>(input: {
      readonly body?: unknown
      readonly method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT"
      readonly path: string
    }) {
      const headers = new Headers()
      const token = await tokenProvider()

      if (token !== null) {
        headers.set("Authorization", `Bearer ${token}`)
      }

      if (input.body !== undefined) {
        headers.set("Content-Type", "application/json")
      }

      const request = new Request(`${normalizedBaseUrl}${input.path}`, {
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        headers,
        method: input.method,
      })

      try {
        const response = await fetch(request)
        const body = await response.json().catch(() => null)

        if (!response.ok) {
          return adminApiError(toAdminApiError(response.status, body))
        }

        return adminApiOk(body as TValue)
      } catch {
        return adminApiError(networkAdminApiError())
      }
    },
  }
}

function analyticsSearchParams(input: ReadAdminAnalyticsInput): string {
  const params = new URLSearchParams()

  params.set("days", String(input.days))

  return params.toString()
}

function coursesSearchParams(input: ReadAdminCoursesInput): string {
  const params = new URLSearchParams()

  params.set("category", input.category)
  params.set("page", String(input.page))
  params.set("pageSize", String(input.pageSize))
  params.set("query", input.query)
  params.set("status", input.status)

  return params.toString()
}

function lessonAnalyticsSearchParams(
  input: ReadAdminLessonAnalyticsInput
): string {
  const params = new URLSearchParams()

  params.set("direction", input.direction)
  params.set("page", String(input.page))
  params.set("pageSize", String(input.pageSize))
  params.set("query", input.query)
  params.set("sort", input.sort)

  return params.toString()
}

function usersSearchParams(input: ReadAdminUsersInput): string {
  const params = new URLSearchParams()

  params.set("page", String(input.page))
  params.set("pageSize", String(input.pageSize))
  params.set("query", input.query)
  params.set("sort", input.sort)
  params.set("status", input.status)

  return params.toString()
}
