import { z } from "zod"

import {
  courseIdSchema,
  lessonIdSchema,
  unitIdSchema,
} from "@workspace/core/content/content.ids"
import {
  lessonStepDtoSchema,
  lessonStepTypeSchema,
} from "@workspace/core/content/steps/index"
import {
  nonNegativeIntegerSchema,
  positiveSortOrderSchema,
} from "@workspace/core/content/steps/lesson-step-fields"
import { contentStatusSchema } from "@workspace/core/status"

export const courseVisualKeySchema = z.enum([
  "basic-sentence-writing",
  "grammar-complete",
  "essay-writing",
  "creative-writing",
  "expression",
])

export const lessonSummaryDtoSchema = z.object({
  id: lessonIdSchema,
  title: z.string(),
  category: z.string().nullable(),
  description: z.string().nullable(),
  estimatedMinutes: z.number().int().positive(),
  status: contentStatusSchema,
  sortOrder: positiveSortOrderSchema,
})

export const courseUnitDtoSchema = z.object({
  id: unitIdSchema,
  title: z.string(),
  sortOrder: positiveSortOrderSchema,
  lessons: z.array(lessonSummaryDtoSchema),
})

export const courseSummaryDtoSchema = z.object({
  id: courseIdSchema,
  title: z.string(),
  description: z.string(),
  category: z.string(),
  lessonCount: nonNegativeIntegerSchema,
  status: contentStatusSchema,
  visualKey: courseVisualKeySchema,
})

export const courseListDtoSchema = z.object({
  courses: z.array(courseSummaryDtoSchema),
})

const learnerCourseLessonStatusSchema = z.enum([
  "available",
  "completed",
  "locked",
])

const learnerCourseProgressLessonDtoSchema = z.object({
  lessonId: lessonIdSchema,
  status: learnerCourseLessonStatusSchema,
  currentStepIndex: nonNegativeIntegerSchema.nullable(),
})

const learnerCourseNextLessonDtoSchema = z.object({
  id: lessonIdSchema,
  title: z.string(),
  estimatedMinutes: z.number().int().positive(),
  status: learnerCourseLessonStatusSchema,
  currentStepIndex: nonNegativeIntegerSchema.nullable(),
})

export const courseDetailDtoSchema = courseSummaryDtoSchema.extend({
  progress: z.object({
    completedLessons: nonNegativeIntegerSchema,
    lessons: z.array(learnerCourseProgressLessonDtoSchema),
    nextLesson: learnerCourseNextLessonDtoSchema.nullable(),
    totalLessons: nonNegativeIntegerSchema,
    percentage: z.number().min(0).max(100),
  }),
  units: z.array(courseUnitDtoSchema),
})

export const lessonDtoSchema = z.object({
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

export {
  answerableLessonStepTypes,
  lessonStepDefinitions,
  lessonStepDtoSchema,
  lessonStepTypeSchema,
} from "@workspace/core/content/steps/index"
