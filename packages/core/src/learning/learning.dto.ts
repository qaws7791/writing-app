import { z } from "zod"

export const lessonAnswerDtoSchema = z.object({
  answer: z.string(),
  stepId: z.string().min(1),
})

export const lessonProgressDtoSchema = z.object({
  answers: z.array(lessonAnswerDtoSchema),
  currentStepId: z.string().min(1),
  lessonId: z.string().min(1),
  status: z.enum(["not-started", "in-progress", "completed"]),
  stepOrder: z.number().int().positive(),
})

export const saveLessonProgressRequestDtoSchema = z.object({
  currentStepId: z.string().min(1),
  stepOrder: z.number().int().positive(),
})

export const saveLessonAnswerRequestDtoSchema = z.object({
  answer: z.string(),
  stepId: z.string().min(1),
})

export const completeLessonDtoSchema = z.object({
  completedAt: z.string(),
  completedCount: z.number().int().nonnegative(),
  lessonId: z.string().min(1),
  status: z.literal("completed"),
  wasAlreadyCompleted: z.boolean(),
})

export const courseProgressDtoSchema = z.object({
  completedCount: z.number().int().nonnegative(),
  courseId: z.string().min(1),
  nextLessonId: z.string().min(1).optional(),
  progressPercent: z.number().int().min(0).max(100),
  totalLessons: z.number().int().nonnegative(),
})

export const progressCourseListDtoSchema = z.object({
  courses: z.array(courseProgressDtoSchema),
})

export const curriculumUpgradeVersionDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  versionNumber: z.number().int().positive(),
})

export const curriculumUpgradeTargetVersionDtoSchema =
  curriculumUpgradeVersionDtoSchema.extend({
    changelog: z.string().min(1),
  })

export const curriculumUpgradeNoticeDtoSchema = z.discriminatedUnion("status", [
  z.object({
    courseId: z.string().min(1),
    status: z.literal("not-available"),
  }),
  z.object({
    completedCount: z.number().int().nonnegative(),
    courseId: z.string().min(1),
    fromVersion: curriculumUpgradeVersionDtoSchema,
    message: z.string().min(1),
    migrationId: z.string().min(1),
    status: z.literal("available"),
    toVersion: curriculumUpgradeTargetVersionDtoSchema,
    totalLessons: z.number().int().nonnegative(),
  }),
])

export const curriculumUpgradeApplicationDtoSchema = z.object({
  completedLessonCount: z.number().int().nonnegative(),
  completedLessonIds: z.array(z.string().min(1)),
  courseId: z.string().min(1),
  createdAt: z.string().min(1),
  fromVersionId: z.string().min(1),
  id: z.string().min(1),
  migrationId: z.string().min(1),
  preservedLessonIds: z.array(z.string().min(1)),
  skippedLessonIds: z.array(z.string().min(1)),
  status: z.literal("completed"),
  toVersionId: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const dismissCurriculumUpgradeDtoSchema = z.object({
  courseId: z.string().min(1),
  dismissedAt: z.string().min(1),
  fromVersionId: z.string().min(1),
  status: z.literal("dismissed"),
  toVersionId: z.string().min(1),
})

export const profileDtoSchema = z.object({
  courseCount: z.number().int().nonnegative(),
  completedLessonCount: z.number().int().nonnegative(),
})

export type LessonAnswerDto = z.infer<typeof lessonAnswerDtoSchema>
export type LessonProgressDto = z.infer<typeof lessonProgressDtoSchema>
export type SaveLessonProgressRequestDto = z.infer<
  typeof saveLessonProgressRequestDtoSchema
>
export type SaveLessonAnswerRequestDto = z.infer<
  typeof saveLessonAnswerRequestDtoSchema
>
export type CompleteLessonDto = z.infer<typeof completeLessonDtoSchema>
export type CourseProgressDto = z.infer<typeof courseProgressDtoSchema>
export type ProgressCourseListDto = z.infer<typeof progressCourseListDtoSchema>
export type CurriculumUpgradeNoticeDto = z.infer<
  typeof curriculumUpgradeNoticeDtoSchema
>
export type CurriculumUpgradeApplicationDto = z.infer<
  typeof curriculumUpgradeApplicationDtoSchema
>
export type DismissCurriculumUpgradeDto = z.infer<
  typeof dismissCurriculumUpgradeDtoSchema
>
export type ProfileDto = z.infer<typeof profileDtoSchema>
