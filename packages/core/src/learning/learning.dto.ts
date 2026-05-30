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
