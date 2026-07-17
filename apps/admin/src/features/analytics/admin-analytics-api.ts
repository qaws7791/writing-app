import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import {
  adminAnalyticsDtoSchema,
  adminLessonAnalyticsPageDtoSchema,
  type AdminAnalyticsDto,
  type AdminLessonAnalyticsPageDto,
} from "@workspace/contracts/admin"

export type AdminLessonAnalyticsSort =
  | "completionRate"
  | "courseTitle"
  | "dropOffRate"
  | "lessonTitle"
export type AdminSortDirection = "asc" | "desc"

export type AdminAnalytics = AdminAnalyticsDto
export type AdminLessonAnalyticsPage = AdminLessonAnalyticsPageDto

export type AdminAnalyticsApi = {
  readonly getAnalytics: (input: {
    readonly days: number
  }) => Promise<AdminApiResult<AdminAnalytics>>
  readonly getLessonAnalytics: (input: {
    readonly direction: AdminSortDirection
    readonly page: number
    readonly pageSize: number
    readonly query: string
    readonly sort: AdminLessonAnalyticsSort
  }) => Promise<AdminApiResult<AdminLessonAnalyticsPage>>
}

export function createAdminAnalyticsApi(
  transport: AdminHttpTransport
): AdminAnalyticsApi {
  return {
    async getAnalytics(input) {
      return transport.requestJson({
        method: "GET",
        path: `/analytics?days=${input.days}`,
        schema: adminAnalyticsDtoSchema,
      })
    },
    async getLessonAnalytics(input) {
      const params = new URLSearchParams()
      params.set("direction", input.direction)
      params.set("page", String(input.page))
      params.set("pageSize", String(input.pageSize))
      params.set("query", input.query)
      params.set("sort", input.sort)
      return transport.requestJson({
        method: "GET",
        path: `/analytics/lessons?${params.toString()}`,
        schema: adminLessonAnalyticsPageDtoSchema,
      })
    },
  }
}
