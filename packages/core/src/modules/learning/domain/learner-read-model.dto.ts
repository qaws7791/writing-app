import { z } from "zod"

import { courseVisualKeySchema } from "@workspace/core/modules/content/domain/content.dto"

export const learnerProfileStatsDtoSchema = z.object({
  completedLessons: z.number().int().nonnegative(),
  currentStreakDays: z.number().int().nonnegative(),
  lastActiveDate: z.string().nullable(),
  progressPercent: z.number().int().min(0).max(100),
  totalLessons: z.number().int().nonnegative(),
})

export const lessonAvailabilityStatusValues = [
  "available",
  "completed",
  "locked",
] as const

export const lessonAvailabilityStatusSchema = z.enum(
  lessonAvailabilityStatusValues
)

export const learnerProgressLessonDtoSchema = z.object({
  currentStepIndex: z.number().int().nonnegative().nullable(),
  estimatedMinutes: z.number().int().positive(),
  id: z.string(),
  status: lessonAvailabilityStatusSchema,
  title: z.string(),
})

export const learnerProgressNextLessonDtoSchema =
  learnerProgressLessonDtoSchema.extend({
    courseId: z.string(),
  })

export const learnerProgressCourseDtoSchema = z.object({
  id: z.string(),
  lessons: z.array(learnerProgressLessonDtoSchema),
  nextLessons: z.array(learnerProgressNextLessonDtoSchema),
  progressPercent: z.number().int().min(0).max(100),
  title: z.string(),
  visualKey: courseVisualKeySchema,
})

export const learnerProgressOverviewDtoSchema = z.object({
  courses: z.array(learnerProgressCourseDtoSchema),
  user: z.object({
    currentStreakDays: z.number().int().nonnegative(),
  }),
})

export type LearnerProfileStatsDto = z.infer<
  typeof learnerProfileStatsDtoSchema
>

export type LessonAvailabilityStatus = z.infer<
  typeof lessonAvailabilityStatusSchema
>

export type LearnerProgressOverviewDto = z.infer<
  typeof learnerProgressOverviewDtoSchema
>
