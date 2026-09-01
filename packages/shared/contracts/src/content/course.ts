import { z } from "zod"

import {
  courseIdSchema,
  lessonIdSchema,
  unitIdSchema,
} from "#contracts/content/ids"
import {
  lessonStepDtoSchema,
  lessonStepTypeSchema,
} from "#contracts/content/steps"
import {
  nonNegativeIntegerSchema,
  positiveSortOrderSchema,
} from "#contracts/content/steps/lesson-step-fields"
import { contentStatusSchema } from "#contracts/content/status"

export {
  answerableLessonStepTypes,
  lessonStepDefinitions,
  lessonStepDtoSchema,
  lessonStepTypeSchema,
} from "#contracts/content/steps"

/**
 * 레슨(세션) 길이 및 스텝 수 제품 계약:
 * 한 레슨(세션)은 5~10분의 짧은 마이크로러닝 세션으로 완결되며 기본 예상 시간은 5분이다.
 * 세션 스텝 수는 12스텝을 기본값으로 하며, 활동 난이도와 유형에 따라 8(최소)~15(최대)스텝 사이에서 유연하게 구성한다.
 */
export const DEFAULT_LESSON_ESTIMATED_MINUTES = 5
export const MIN_RECOMMENDED_LESSON_ESTIMATED_MINUTES = 5
export const MAX_RECOMMENDED_LESSON_ESTIMATED_MINUTES = 10
export const DEFAULT_LESSON_STEP_COUNT = 12
export const MIN_RECOMMENDED_LESSON_STEP_COUNT = 8
export const MAX_RECOMMENDED_LESSON_STEP_COUNT = 15

export const lessonDurationContract = {
  defaultMinutes: DEFAULT_LESSON_ESTIMATED_MINUTES,
  defaultSteps: DEFAULT_LESSON_STEP_COUNT,
  maxRecommendedMinutes: MAX_RECOMMENDED_LESSON_ESTIMATED_MINUTES,
  maxRecommendedSteps: MAX_RECOMMENDED_LESSON_STEP_COUNT,
  minRecommendedMinutes: MIN_RECOMMENDED_LESSON_ESTIMATED_MINUTES,
  minRecommendedSteps: MIN_RECOMMENDED_LESSON_STEP_COUNT,
} as const

export const courseVisualKeyValues = [
  "basic-sentence-writing",
  "grammar-complete",
  "essay-writing",
  "creative-writing",
  "expression",
  "business-email",
  "business-writing",
  "emotion-writing",
  "reading-comprehension",
  "sentence-structure",
  "vocabulary-basics",
] as const
export const courseVisualKeySchema = z.enum(courseVisualKeyValues)

export const lessonSummaryDtoSchema = z.strictObject({
  id: lessonIdSchema,
  title: z.string(),
  category: z.string().nullable(),
  description: z.string().nullable(),
  estimatedMinutes: z.number().int().positive(),
  status: contentStatusSchema,
  sortOrder: positiveSortOrderSchema,
})

export const courseUnitDtoSchema = z.strictObject({
  id: unitIdSchema,
  title: z.string(),
  sortOrder: positiveSortOrderSchema,
  lessons: z.array(lessonSummaryDtoSchema),
})

export const courseSummaryDtoSchema = z.strictObject({
  id: courseIdSchema,
  title: z.string(),
  description: z.string(),
  category: z.string(),
  lessonCount: nonNegativeIntegerSchema,
  status: contentStatusSchema,
  visualKey: courseVisualKeySchema,
})

export const courseListDtoSchema = z.strictObject({
  courses: z.array(courseSummaryDtoSchema),
})

const learnerCourseLessonStatusSchema = z.enum([
  "available",
  "completed",
  "locked",
])

const learnerCourseProgressLessonDtoSchema = z.strictObject({
  lessonId: lessonIdSchema,
  status: learnerCourseLessonStatusSchema,
  currentStepIndex: nonNegativeIntegerSchema.nullable(),
})

const learnerCourseNextLessonDtoSchema = z.strictObject({
  id: lessonIdSchema,
  title: z.string(),
  estimatedMinutes: z.number().int().positive(),
  status: learnerCourseLessonStatusSchema,
  currentStepIndex: nonNegativeIntegerSchema.nullable(),
})

export const courseDetailDtoSchema = courseSummaryDtoSchema.extend({
  progress: z.strictObject({
    completedLessons: nonNegativeIntegerSchema,
    lessons: z.array(learnerCourseProgressLessonDtoSchema),
    nextLesson: learnerCourseNextLessonDtoSchema.nullable(),
    totalLessons: nonNegativeIntegerSchema,
    percentage: z.number().min(0).max(100),
  }),
  units: z.array(courseUnitDtoSchema),
})

export const lessonDtoSchema = z.strictObject({
  id: lessonIdSchema,
  courseId: courseIdSchema,
  unitId: unitIdSchema,
  title: z.string(),
  category: z.string().nullable(),
  description: z.string().nullable(),
  estimatedMinutes: z.number().int().positive(),
  summary: z.array(z.string()),
  steps: z.array(lessonStepDtoSchema),
})

export type LessonStepType = z.infer<typeof lessonStepTypeSchema>
export type LessonStepDto = z.infer<typeof lessonStepDtoSchema>
export type LessonSummaryDto = z.infer<typeof lessonSummaryDtoSchema>
export type CourseUnitDto = z.infer<typeof courseUnitDtoSchema>
export type CourseVisualKey = z.infer<typeof courseVisualKeySchema>
export type CourseSummaryDto = z.infer<typeof courseSummaryDtoSchema>
export type CourseListDto = z.infer<typeof courseListDtoSchema>
export type CourseDetailDto = z.infer<typeof courseDetailDtoSchema>
export type LessonDto = z.infer<typeof lessonDtoSchema>
