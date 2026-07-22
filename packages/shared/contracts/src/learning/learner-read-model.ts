import { z } from "zod"

import { courseVisualKeySchema } from "#contracts/content/course"
import { courseIdSchema, lessonIdSchema } from "#contracts/content/ids"

export const learnerProfileStatsDtoSchema = z.strictObject({
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

export const learnerProgressLessonDtoSchema = z.strictObject({
  currentStepIndex: z.number().int().nonnegative().nullable(),
  estimatedMinutes: z.number().int().positive(),
  id: lessonIdSchema,
  status: lessonAvailabilityStatusSchema,
  title: z.string(),
})

export const learnerProgressNextLessonDtoSchema =
  learnerProgressLessonDtoSchema.extend({
    courseId: courseIdSchema,
  })

export const learnerProgressCourseDtoSchema = z.strictObject({
  id: courseIdSchema,
  lessons: z.array(learnerProgressLessonDtoSchema),
  nextLessons: z.array(learnerProgressNextLessonDtoSchema),
  progressPercent: z.number().int().min(0).max(100),
  title: z.string(),
  visualKey: courseVisualKeySchema,
})

export const progressCourseStatusFilterValues = [
  "in_progress",
  "completed",
] as const

export const progressCourseStatusFilterSchema = z.enum(
  progressCourseStatusFilterValues
)

export const learnerProgressOverviewDtoSchema = z.strictObject({
  courses: z.array(learnerProgressCourseDtoSchema),
  user: z.strictObject({
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

export type ProgressCourseStatusFilter = z.infer<
  typeof progressCourseStatusFilterSchema
>
