import { z } from "zod"

export const contentStatuses = {
  active: "active",
  archived: "archived",
} as const
export const contentStatusValues = [
  contentStatuses.active,
  contentStatuses.archived,
] as const
export const contentStatusSchema = z.enum(contentStatusValues)

export const adminCourseListStatusFilterSchema = z.union([
  z.literal("all"),
  contentStatusSchema,
])

export type ContentStatus = z.infer<typeof contentStatusSchema>
export type AdminCourseListStatusFilter = z.infer<
  typeof adminCourseListStatusFilterSchema
>
