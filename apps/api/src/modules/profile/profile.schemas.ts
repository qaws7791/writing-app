import { learnerUserSchema } from "@/http/openapi"
import { z } from "@workspace/hono/zod"

export const profileResponseSchema = z.object({
  stats: z.object({
    completedLessons: z.number().int().nonnegative(),
    currentStreakDays: z.number().int().nonnegative(),
    lastActiveDate: z.string().nullable(),
    progressPercent: z.number().int().min(0).max(100),
    totalLessons: z.number().int().nonnegative(),
  }),
  user: learnerUserSchema,
})
