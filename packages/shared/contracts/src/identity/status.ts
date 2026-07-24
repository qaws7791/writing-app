import { z } from "zod"

export const learnerAccountStatuses = {
  active: "active",
  deleted: "deleted",
  suspended: "suspended",
} as const
export const learnerAccountStatusValues = [
  learnerAccountStatuses.active,
  learnerAccountStatuses.suspended,
  learnerAccountStatuses.deleted,
] as const
export const learnerAccountStatusSchema = z.enum(learnerAccountStatusValues)

export const learnerOperationalStatusValues = [
  learnerAccountStatuses.active,
  learnerAccountStatuses.suspended,
] as const
export const learnerOperationalStatusSchema = z.enum(
  learnerOperationalStatusValues
)

export const adminUserListStatusFilterSchema = z.union([
  z.literal("all"),
  learnerAccountStatusSchema,
])
export const adminUserSortSchema = z.enum([
  "joined",
  "lastActive",
  "lessonsDone",
  "streak",
])
export const adminUpdateUserStatusRequestSchema = z.object({
  status: learnerOperationalStatusSchema,
})

export type LearnerAccountStatus = z.infer<typeof learnerAccountStatusSchema>
export type LearnerOperationalStatus = z.infer<
  typeof learnerOperationalStatusSchema
>
export type AdminUserListStatusFilter = z.infer<
  typeof adminUserListStatusFilterSchema
>
export type AdminUserSort = z.infer<typeof adminUserSortSchema>
export type AdminUserStatus = z.infer<typeof learnerAccountStatusSchema>
export type AdminUpdateUserStatusRequest = z.infer<
  typeof adminUpdateUserStatusRequestSchema
>
