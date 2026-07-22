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

export const adminLessonAnalyticsQuerySchema = z.object({
  direction: adminSortDirectionSchema.default("asc"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  query: z.string().default(""),
  sort: adminLessonAnalyticsSortSchema.default("completionRate"),
})

export type AdminLessonAnalyticsSort = z.infer<
  typeof adminLessonAnalyticsSortSchema
>
export type AdminSortDirection = z.infer<typeof adminSortDirectionSchema>
