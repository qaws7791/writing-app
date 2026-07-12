import { z } from "zod"
import { adminNonNegativeIntegerSchema } from "@workspace/contracts/admin/admin-shared"
import { userIdSchema } from "@workspace/contracts/admin/admin-ids"

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
