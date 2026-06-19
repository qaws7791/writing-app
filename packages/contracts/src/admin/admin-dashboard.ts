import { z } from "zod"
import { adminNonNegativeIntegerSchema } from "@workspace/contracts/admin/admin-shared"

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
      userId: z.string(),
    })
  ),
})

export type AdminDashboardDto = z.infer<typeof adminDashboardDtoSchema>
