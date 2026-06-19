import { z } from "zod"
import {
  contentStatusSchema,
  learnerAccountStatusSchema,
  learnerOperationalStatusSchema,
} from "@workspace/contracts/status"

export const adminNonNegativeIntegerSchema = z.number().int().nonnegative()
export const adminPositiveIntegerSchema = z.number().int().positive()

export const adminUserStatusSchema = learnerAccountStatusSchema
export const adminUserListStatusFilterSchema = z.union([
  z.literal("all"),
  adminUserStatusSchema,
])
export const adminUserSortSchema = z.enum([
  "joined",
  "lastActive",
  "lessonsDone",
  "streak",
])
export const adminLessonAnalyticsSortSchema = z.enum([
  "course",
  "completionRate",
  "dropOff",
  "lesson",
])
export const adminSortDirectionSchema = z.enum(["asc", "desc"])
export const adminUpdateUserStatusRequestSchema = z.object({
  status: learnerOperationalStatusSchema,
})

export const adminContentStatusSchema = contentStatusSchema
export const adminCourseListStatusFilterSchema = z.union([
  z.literal("all"),
  adminContentStatusSchema,
])

export type AdminCourseListStatusFilter = z.infer<
  typeof adminCourseListStatusFilterSchema
>
export type AdminLessonAnalyticsSort = z.infer<
  typeof adminLessonAnalyticsSortSchema
>
export type AdminSortDirection = z.infer<typeof adminSortDirectionSchema>
export type AdminUserListStatusFilter = z.infer<
  typeof adminUserListStatusFilterSchema
>
export type AdminUserSort = z.infer<typeof adminUserSortSchema>
export type AdminUserStatus = z.infer<typeof adminUserStatusSchema>
export type AdminUpdateUserStatusRequest = z.infer<
  typeof adminUpdateUserStatusRequestSchema
>
