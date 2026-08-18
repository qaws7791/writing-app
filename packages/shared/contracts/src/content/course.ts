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
