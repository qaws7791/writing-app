import { courseVisualKeySchema } from "@workspace/core/modules/content"
import { z } from "@workspace/hono/zod"

export const progressLessonStatusSchema = z.enum([
  "available",
  "completed",
  "locked",
])

export const progressLessonSchema = z.object({
  currentStepIndex: z.number().int().nonnegative().nullable(),
  estimatedMinutes: z.number().int().positive(),
  id: z.string(),
  status: progressLessonStatusSchema,
  title: z.string(),
})

export const progressNextLessonSchema = progressLessonSchema.extend({
  courseId: z.string(),
})

export const progressResponseSchema = z.object({
  courses: z.array(
    z.object({
      id: z.string(),
      lessons: z.array(progressLessonSchema),
      nextLessons: z.array(progressNextLessonSchema),
      progressPercent: z.number().int().min(0).max(100),
      title: z.string(),
      visualKey: courseVisualKeySchema,
    })
  ),
  user: z.object({
    currentStreakDays: z.number().int().nonnegative(),
  }),
})
