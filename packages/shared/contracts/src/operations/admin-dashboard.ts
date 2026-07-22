import { z } from "zod"
import { userIdSchema } from "#contracts/identity/admin-ids"
import { nonNegativeIntegerSchema as adminNonNegativeIntegerSchema } from "#contracts/shared/integer"

export const adminDashboardDtoSchema = z.object({
  metrics: z.object({
    activeCourses: adminNonNegativeIntegerSchema,
    activeLessons: adminNonNegativeIntegerSchema,
    activeUsersLast7Days: adminNonNegativeIntegerSchema,
    completedLessons: adminNonNegativeIntegerSchema,
    signupsLast7Days: adminNonNegativeIntegerSchema,
    signupsToday: adminNonNegativeIntegerSchema,
    totalUsers: adminNonNegativeIntegerSchema,
  }),
  recentActivities: z.array(
    z.object({
      currentStreakDays: adminNonNegativeIntegerSchema,
      email: z.email(),
      lastActiveDate: z.string().nullable(),
      name: z.string(),
      userId: userIdSchema,
    })
  ),
})

export type AdminDashboardDto = z.infer<typeof adminDashboardDtoSchema>
