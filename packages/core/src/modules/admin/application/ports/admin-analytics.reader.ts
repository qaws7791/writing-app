import type {
  AdminAnalyticsDto,
  AdminLessonAnalyticsItemDto,
  AdminLessonAnalyticsSort,
  AdminSortDirection,
} from "@workspace/contracts/operations/dashboard-analytics-data"

export type ReadAdminAnalyticsInput = {
  readonly days: number
  readonly now: Date
}

export type ReadAdminLessonAnalyticsInput = {
  readonly direction: AdminSortDirection
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminLessonAnalyticsSort
}

export type ReadAdminLessonAnalyticsResult = {
  readonly items: readonly AdminLessonAnalyticsItemDto[]
  readonly page: number
  readonly pageSize: number
  readonly totalItems: number
  readonly totalPages: number
}

export type AdminAnalyticsReader = {
  readonly readAnalytics: (
    input: ReadAdminAnalyticsInput
  ) => Promise<AdminAnalyticsDto>
  readonly readLessonAnalytics: (
    input: ReadAdminLessonAnalyticsInput
  ) => Promise<ReadAdminLessonAnalyticsResult>
}
