import { z } from "zod"

const nonNegativeIntegerSchema = z.number().int().nonnegative()

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
