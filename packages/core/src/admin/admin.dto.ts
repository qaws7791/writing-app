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
export const adminLessonAnalyticsSortSchema = z.enum([
  "course",
  "completionRate",
  "dropOff",
  "lesson",
])
export const adminSortDirectionSchema = z.enum(["asc", "desc"])
export const adminUpdateUserStatusRequestSchema = z.object({
  status: z.enum(["active", "suspended"]),
})
export const adminNoticeSettingsRequestSchema = z.object({
  announce: z.string(),
  banner: z.string(),
})
export const adminLegalSettingsRequestSchema = z.object({
  privacy: z.string(),
  terms: z.string(),
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

export const adminLessonAnalyticsItemDtoSchema = z.object({
  completed: nonNegativeIntegerSchema,
  completionRate: nonNegativeIntegerSchema.max(100),
  courseId: z.string(),
  courseTitle: z.string(),
  dropOffRate: nonNegativeIntegerSchema.max(100),
  lessonId: z.string(),
  lessonTitle: z.string(),
  started: nonNegativeIntegerSchema,
})

export const adminAnalyticsDtoSchema = z.object({
  dailySeries: z.array(
    z.object({
      completions: nonNegativeIntegerSchema,
      date: z.string(),
      signups: nonNegativeIntegerSchema,
    })
  ),
  streakBuckets: z.array(
    z.object({
      count: nonNegativeIntegerSchema,
      label: z.string(),
    })
  ),
  worstLessons: z.array(adminLessonAnalyticsItemDtoSchema),
})

export const adminLessonAnalyticsPageDtoSchema = z.object({
  items: z.array(adminLessonAnalyticsItemDtoSchema),
  pagination: z.object({
    page: positiveIntegerSchema,
    pageSize: positiveIntegerSchema,
    totalItems: nonNegativeIntegerSchema,
    totalPages: positiveIntegerSchema,
  }),
})

export const adminSettingsDtoSchema = z.object({
  legal: adminLegalSettingsRequestSchema,
  notice: adminNoticeSettingsRequestSchema,
})

export const adminContentResetResultSchema = z.object({
  changed: z.object({
    archived: nonNegativeIntegerSchema,
    courses: nonNegativeIntegerSchema,
    lessons: nonNegativeIntegerSchema,
    steps: nonNegativeIntegerSchema,
    units: nonNegativeIntegerSchema,
  }),
  revision: nonNegativeIntegerSchema,
})

export type AdminAnalyticsDto = z.infer<typeof adminAnalyticsDtoSchema>
export type AdminContentResetResultDto = z.infer<
  typeof adminContentResetResultSchema
>
export type AdminUserDetailDto = z.infer<typeof adminUserDetailDtoSchema>
export type AdminUserListDto = z.infer<typeof adminUserListDtoSchema>
export type AdminSettingsDto = z.infer<typeof adminSettingsDtoSchema>
export type AdminNoticeSettingsRequest = z.infer<
  typeof adminNoticeSettingsRequestSchema
>
export type AdminLegalSettingsRequest = z.infer<
  typeof adminLegalSettingsRequestSchema
>
export type AdminUserListStatusFilter = z.infer<
  typeof adminUserListStatusFilterSchema
>
export type AdminLessonAnalyticsPageDto = z.infer<
  typeof adminLessonAnalyticsPageDtoSchema
>
export type AdminLessonAnalyticsSort = z.infer<
  typeof adminLessonAnalyticsSortSchema
>
export type AdminSortDirection = z.infer<typeof adminSortDirectionSchema>
export type AdminUserSort = z.infer<typeof adminUserSortSchema>
export type AdminUserStatus = z.infer<typeof adminUserStatusSchema>
export type AdminUpdateUserStatusRequest = z.infer<
  typeof adminUpdateUserStatusRequestSchema
>
export type AdminDeleteUserResultDto = z.infer<
  typeof adminDeleteUserResultSchema
>
