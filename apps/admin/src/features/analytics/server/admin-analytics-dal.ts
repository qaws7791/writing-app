import type { AdminApiResult } from "@/shared/http/admin-api-result"
import type { AdminHttpTransport } from "@/shared/http/admin-http-transport"
import {
  adminAnalyticsDtoSchema,
  adminLessonAnalyticsPageDtoSchema,
} from "@workspace/contracts/operations/admin-analytics"
import type {
  AdminAnalytics,
  AdminLessonAnalyticsPage,
} from "@/entities/admin-analytics/model/admin-analytics"

type AdminLessonAnalyticsSort =
  | "completionRate"
  | "courseTitle"
  | "dropOffRate"
  | "lessonTitle"
type AdminSortDirection = "asc" | "desc"

export type AdminAnalyticsDal = {
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

export function createAdminAnalyticsDal(
  transport: AdminHttpTransport
): AdminAnalyticsDal {
  return {
    async getAnalytics(input) {
      return transport.requestJson({
        method: "GET",
        path: `/api/admin/analytics?days=${input.days}`,
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
        path: `/api/admin/analytics/lessons?${params.toString()}`,
        schema: adminLessonAnalyticsPageDtoSchema,
      })
    },
  }
}
