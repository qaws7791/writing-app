import {
  adminLessonAnalyticsQuerySchema,
  type AdminLessonAnalyticsSort,
  type AdminSortDirection,
} from "@workspace/contracts/operations/analytics-query"

export type AdminAnalyticsFilters = Readonly<{
  direction: AdminSortDirection
  page: number
  pageSize: number
  query: string
  sort: AdminLessonAnalyticsSort
}>

const defaultFilters = adminLessonAnalyticsQuerySchema.parse({})

/** 추이 차트가 사용하는 기간 창입니다. */
export const analyticsWindowDays = 30

export function parseAdminAnalyticsFilters(
  searchParams: Record<string, string | string[] | undefined>
): AdminAnalyticsFilters {
  return {
    direction: adminLessonAnalyticsQuerySchema.shape.direction
      .catch(defaultFilters.direction)
      .parse(readString(searchParams["direction"])),
    page: adminLessonAnalyticsQuerySchema.shape.page
      .catch(defaultFilters.page)
      .parse(readString(searchParams["page"])),
    pageSize: adminLessonAnalyticsQuerySchema.shape.pageSize
      .catch(defaultFilters.pageSize)
      .parse(readString(searchParams["pageSize"])),
    query: adminLessonAnalyticsQuerySchema.shape.query
      .catch(defaultFilters.query)
      .parse(readString(searchParams["query"])),
    sort: adminLessonAnalyticsQuerySchema.shape.sort
      .catch(defaultFilters.sort)
      .parse(readString(searchParams["sort"])),
  }
}

function readString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined
}
