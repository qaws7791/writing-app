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

export type AdminLessonAnalyticsItem = {
  readonly completed: number
  readonly completionRate: number
  readonly courseId: string
  readonly courseTitle: string
  readonly dropOffRate: number
  readonly lessonId: string
  readonly lessonTitle: string
  readonly started: number
}

export type AdminAnalytics = {
  readonly dailySeries: readonly {
    readonly completions: number
    readonly date: string
    readonly signups: number
  }[]
  readonly streakBuckets: readonly {
    readonly count: number
    readonly label: string
  }[]
  readonly worstLessons: readonly AdminLessonAnalyticsItem[]
}

export type AdminLessonAnalyticsPage = {
  readonly items: readonly AdminLessonAnalyticsItem[]
  readonly pagination: {
    readonly page: number
    readonly pageSize: number
    readonly totalItems: number
    readonly totalPages: number
  }
}

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
      const result = await transport.requestJson({
        method: "GET",
        path: `/analytics?days=${input.days}`,
        schema: adminAnalyticsDtoSchema,
      })
      return result.status === "error"
        ? result
        : { status: "ok", value: toAnalytics(result.value) }
    },
    async getLessonAnalytics(input) {
      const params = new URLSearchParams()
      params.set("direction", input.direction)
      params.set("page", String(input.page))
      params.set("pageSize", String(input.pageSize))
      params.set("query", input.query)
      params.set("sort", input.sort)
      const result = await transport.requestJson({
        method: "GET",
        path: `/analytics/lessons?${params.toString()}`,
        schema: adminLessonAnalyticsPageDtoSchema,
      })
      return result.status === "error"
        ? result
        : { status: "ok", value: toLessonPage(result.value) }
    },
  }
}

function toAnalytics(dto: AdminAnalyticsDto): AdminAnalytics {
  return {
    dailySeries: dto.dailySeries.map((item) => ({ ...item })),
    streakBuckets: dto.streakBuckets.map((item) => ({ ...item })),
    worstLessons: dto.worstLessons.map(toLesson),
  }
}

function toLessonPage(
  dto: AdminLessonAnalyticsPageDto
): AdminLessonAnalyticsPage {
  return {
    items: dto.items.map(toLesson),
    pagination: { ...dto.pagination },
  }
}

function toLesson(
  dto: AdminAnalyticsDto["worstLessons"][number]
): AdminLessonAnalyticsItem {
  return { ...dto }
}
