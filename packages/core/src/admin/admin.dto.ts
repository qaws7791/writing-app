import { z } from "zod"

const nonNegativeIntegerSchema = z.number().int().nonnegative()
const positiveIntegerSchema = z.number().int().positive()

export const adminUserStatusSchema = z.enum(["active", "suspended", "deleted"])
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
export const adminUpdateUserStatusRequestSchema = z.object({
  status: z.enum(["active", "suspended"]),
})

export const adminDashboardDtoSchema = z.object({
  metrics: z.object({
    activeCourses: nonNegativeIntegerSchema,
    activeLessons: nonNegativeIntegerSchema,
    activeUsersLast7Days: nonNegativeIntegerSchema,
    completedLessons: nonNegativeIntegerSchema,
    signupsLast7Days: nonNegativeIntegerSchema,
    signupsToday: nonNegativeIntegerSchema,
    totalUsers: nonNegativeIntegerSchema,
  }),
  recentActivities: z.array(
    z.object({
      currentStreakDays: nonNegativeIntegerSchema,
      email: z.email(),
      lastActiveDate: z.string().nullable(),
      name: z.string(),
      userId: z.string(),
    })
  ),
})

export type AdminDashboardDto = z.infer<typeof adminDashboardDtoSchema>

export const adminUserListItemDtoSchema = z.object({
  email: z.email(),
  id: z.string(),
  joined: z.string(),
  lastActive: z.string().nullable(),
  lessonsDone: nonNegativeIntegerSchema,
  name: z.string(),
  status: adminUserStatusSchema,
  streak: nonNegativeIntegerSchema,
})

export const adminUserListDtoSchema = z.object({
  items: z.array(adminUserListItemDtoSchema),
  pagination: z.object({
    page: positiveIntegerSchema,
    pageSize: positiveIntegerSchema,
    totalItems: nonNegativeIntegerSchema,
    totalPages: positiveIntegerSchema,
  }),
})

export const adminUserDetailDtoSchema = adminUserListItemDtoSchema.extend({
  progressPercent: nonNegativeIntegerSchema.max(100),
  totalLessons: nonNegativeIntegerSchema,
})

export const adminDeleteUserResultSchema = z.object({
  deleted: z.literal(true),
})

export type AdminUserDetailDto = z.infer<typeof adminUserDetailDtoSchema>
export type AdminUserListDto = z.infer<typeof adminUserListDtoSchema>
export type AdminUserListStatusFilter = z.infer<
  typeof adminUserListStatusFilterSchema
>
export type AdminUserSort = z.infer<typeof adminUserSortSchema>
export type AdminUserStatus = z.infer<typeof adminUserStatusSchema>
export type AdminUpdateUserStatusRequest = z.infer<
  typeof adminUpdateUserStatusRequestSchema
>
export type AdminDeleteUserResultDto = z.infer<
  typeof adminDeleteUserResultSchema
>
