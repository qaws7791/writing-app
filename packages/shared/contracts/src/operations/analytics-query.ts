import { z } from "zod"

export const adminLessonAnalyticsSortSchema = z.enum([
  "course",
  "completionRate",
  "dropOff",
  "lesson",
])
export const adminSortDirectionSchema = z.enum(["asc", "desc"])

export type AdminLessonAnalyticsSort = z.infer<
  typeof adminLessonAnalyticsSortSchema
>
export type AdminSortDirection = z.infer<typeof adminSortDirectionSchema>
