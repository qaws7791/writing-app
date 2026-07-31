import { z } from "zod"

export const adminLessonAnalyticsSortSchema = z.enum([
  "course",
  "completionRate",
  "dropOff",
  "lesson",
])
export const adminSortDirectionSchema = z.enum(["asc", "desc"])

export const adminAnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
})

/**
 * 기본 정렬은 이탈률이 높은 레슨을 먼저 보여준다. 별도 이탈률 상위 표를 두지 않고
 * 이 표 하나로 개선 후보를 판단한다.
 */
export const adminLessonAnalyticsQuerySchema = z.object({
  direction: adminSortDirectionSchema.default("desc"),
  page: z.coerce.number().int().positive().max(10_000).default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  query: z.string().trim().max(100).default(""),
  sort: adminLessonAnalyticsSortSchema.default("dropOff"),
})

export type AdminLessonAnalyticsSort = z.infer<
  typeof adminLessonAnalyticsSortSchema
>
export type AdminSortDirection = z.infer<typeof adminSortDirectionSchema>
