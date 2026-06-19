import {
  contractAdminApiError,
  networkAdminApiError,
  toAdminApiError,
} from "@/lib/api/api-error"
import {
  adminApiError,
  adminApiOk,
  type AdminApiResult,
} from "@/lib/api/api-result"
import { adminSessionCookieName } from "@/lib/auth/admin-session-token"
import { buildAdminApiUrl, type AdminApiBaseUrl } from "@/runtime-config"
import type {
  AdminApi,
  ReadAdminAnalyticsInput,
  ReadAdminCoursesInput,
  ReadAdminLessonAnalyticsInput,
  ReadAdminUsersInput,
  UpdateAdminUserStatusInput,
} from "@/lib/api/admin-api"
import {
  adminAnalyticsDtoSchema,
  adminArchiveCourseResultSchema,
  adminContentResetResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseListDtoSchema,
  adminDashboardDtoSchema,
  adminDeleteUserResultSchema,
  adminLessonAnalyticsPageDtoSchema,
  adminSettingsDtoSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
} from "@workspace/contracts/admin"
import { fetchHttpResponse, type HttpFetch } from "@workspace/http-client"

type ResponseSchema<TValue> = {
  readonly safeParse: (value: unknown) =>
    | {
        readonly data: TValue
        readonly success: true
      }
    | {
        readonly success: false
      }
}

export type AdminFetchLike = HttpFetch
export type AdminTokenProvider = () => Promise<string | null> | string | null

export function createHttpAdminApi({
  baseUrl,
  fetch,
  tokenProvider,
}: {
  readonly baseUrl: AdminApiBaseUrl
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
        schema: adminArchiveCourseResultSchema,
      })
    },
    createCourse() {
      return client.requestJson({
        method: "POST",
        path: "/courses",
        schema: adminCourseDetailDtoSchema,
      })
    },
    deleteUser(userId) {
      return client.requestJson({
        method: "DELETE",
        path: `/users/${userId}`,
        schema: adminDeleteUserResultSchema,
      })
    },
    getAnalytics(input) {
      return client.requestJson({
        method: "GET",
        path: `/analytics?${analyticsSearchParams(input)}`,
        schema: adminAnalyticsDtoSchema,
      })
    },
    getCourses(input) {
      return client.requestJson({
        method: "GET",
        path: `/courses?${coursesSearchParams(input)}`,
        schema: adminCourseListDtoSchema,
      })
    },
    getCourseEditor(courseId) {
      return client.requestJson({
        method: "GET",
        path: `/courses/${courseId}/editor`,
        schema: adminCourseDetailDtoSchema,
      })
    },
    getDashboard() {
      return client.requestJson({
        method: "GET",
        path: "/dashboard",
        schema: adminDashboardDtoSchema,
      })
    },
    getLessonAnalytics(input) {
      return client.requestJson({
        method: "GET",
        path: `/analytics/lessons?${lessonAnalyticsSearchParams(input)}`,
        schema: adminLessonAnalyticsPageDtoSchema,
      })
    },
    getSettings() {
      return client.requestJson({
        method: "GET",
        path: "/settings",
        schema: adminSettingsDtoSchema,
      })
    },
    getUser(userId) {
      return client.requestJson({
        method: "GET",
        path: `/users/${userId}`,
        schema: adminUserDetailDtoSchema,
      })
    },
    getUsers(input) {
      return client.requestJson({
        method: "GET",
        path: `/users?${usersSearchParams(input)}`,
        schema: adminUserListDtoSchema,
      })
    },
    resetContent() {
      return client.requestJson({
        body: {},
        method: "POST",
        path: "/settings/content-reset",
        schema: adminContentResetResultSchema,
      })
    },
    saveLegalSettings(input) {
      return client.requestJson({
        body: input,
        method: "PUT",
        path: "/settings/legal",
        schema: adminSettingsDtoSchema,
      })
    },
    saveNoticeSettings(input) {
      return client.requestJson({
        body: input,
        method: "PUT",
        path: "/settings/notice",
        schema: adminSettingsDtoSchema,
      })
    },
    updateUserStatus(input: UpdateAdminUserStatusInput) {
      return client.requestJson({
        body: {
          status: input.status,
        },
        method: "PATCH",
        path: `/users/${input.userId}/status`,
        schema: adminUserDetailDtoSchema,
      })
    },
  }
}

function createAdminHttpClient({
  baseUrl,
  fetch,
  tokenProvider,
}: {
  readonly baseUrl: AdminApiBaseUrl
  readonly fetch: AdminFetchLike
  readonly tokenProvider: AdminTokenProvider
}): {
  readonly requestJson: <TValue>(input: {
    readonly body?: unknown
    readonly method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT"
    readonly path: string
    readonly schema: ResponseSchema<TValue>
  }) => Promise<AdminApiResult<TValue>>
} {
  return {
    async requestJson<TValue>(input: {
      readonly body?: unknown
      readonly method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT"
      readonly path: string
      readonly schema: ResponseSchema<TValue>
    }) {
      const headers = new Headers()
      const token = await tokenProvider()

      if (token !== null) {
        headers.set(
          "Cookie",
          `${adminSessionCookieName}=${encodeURIComponent(token)}`
        )
      }

      if (input.body !== undefined) {
        headers.set("Content-Type", "application/json")
      }

      const request = new Request(buildAdminApiUrl(baseUrl, input.path), {
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        credentials: "include",
        headers,
        method: input.method,
      })

      const fetchResult = await fetchHttpResponse(request, fetch)

      if (fetchResult.kind === "network-error") {
        return adminApiError(networkAdminApiError(fetchResult.error))
      }

      const { response } = fetchResult
      const bodyResult = await readJson(response)

      if (bodyResult.kind === "err") {
        return adminApiError(contractAdminApiError(response.status))
      }

      if (!response.ok) {
        return adminApiError(toAdminApiError(response.status, bodyResult.value))
      }

      const parsedBody = input.schema.safeParse(bodyResult.value)

      if (!parsedBody.success) {
        return adminApiError(contractAdminApiError(response.status))
      }

      return adminApiOk(parsedBody.data)
    },
  }
}

async function readJson(response: Response): Promise<
  | {
      readonly kind: "ok"
      readonly value: unknown
    }
  | {
      readonly kind: "err"
    }
> {
  const text = await response.text()

  if (text.length === 0) {
    return {
      kind: "ok",
      value: null,
    }
  }

  try {
    return {
      kind: "ok",
      value: JSON.parse(text) as unknown,
    }
  } catch {
    return {
      kind: "err",
    }
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
