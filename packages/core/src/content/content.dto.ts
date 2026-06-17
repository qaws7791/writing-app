import { z } from "zod"

import {
  courseIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/core/content/content.ids"
import { contentStatusSchema } from "@workspace/core/status"

const positiveSortOrderSchema = z.number().int().positive()
const nonNegativeIntegerSchema = z.number().int().nonnegative()
const optionalTextSchema = z.string().optional()
const labeledTextSchema = z.object({
  label: z.string(),
  text: z.string(),
})
export const courseVisualKeySchema = z.enum([
  "basic-sentence-writing",
  "grammar-complete",
  "essay-writing",
  "creative-writing",
  "expression",
])

export const lessonStepTypeSchema = z.enum([
  "READING",
  "COMPARE",
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "SELECT",
  "ORDER",
  "WRITE",
  "AI_FEEDBACK",
  "MATCH",
  "CATEGORIZE",
])

const lessonStepBaseSchema = z.object({
  id: lessonStepIdSchema,
  sortOrder: positiveSortOrderSchema,
})

const readingStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("READING"),
  title: z.string(),
  guide: z.string(),
  body: z.string(),
  source: optionalTextSchema,
})

const compareStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("COMPARE"),
  title: z.string(),
  versions: z.array(labeledTextSchema).min(2),
  analysis: z.string(),
})

const multipleChoiceStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("MULTIPLE_CHOICE"),
  question: z.string(),
  options: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
      })
    )
    .min(2),
  correct: z.string(),
  explanation: z.string(),
  wrong: optionalTextSchema,
})

const fillBlankStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("FILL_BLANK"),
  template: z.string(),
  words: z.array(z.string()).min(1),
  answer: z.array(z.string()).min(1),
  explanation: z.string(),
})

const selectStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("SELECT"),
  question: z.string(),
  segments: z.array(z.string()).min(1),
  correct: z.array(nonNegativeIntegerSchema).min(1),
  explanation: z.string(),
  layout: optionalTextSchema,
})

const orderStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("ORDER"),
  title: z.string(),
  items: z.array(z.string()).min(1),
  correct: z.array(z.string()).min(1),
  showNumbers: z.boolean().optional(),
  explanation: z.string(),
})

const writeStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("WRITE"),
  title: optionalTextSchema,
  guide: optionalTextSchema,
  min: nonNegativeIntegerSchema,
  goal: nonNegativeIntegerSchema.optional(),
  max: nonNegativeIntegerSchema.optional(),
  badge: optionalTextSchema,
  claim: optionalTextSchema,
  context: optionalTextSchema,
  mode: optionalTextSchema,
  placeholder: optionalTextSchema,
  prompt: optionalTextSchema,
  reference: optionalTextSchema,
  sample: optionalTextSchema,
  structure: optionalTextSchema,
  topic: optionalTextSchema,
  draft: z.boolean().optional(),
})

const aiFeedbackStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("AI_FEEDBACK"),
  target: z.string(),
  focus: z.string(),
  feedback: z.string(),
  showScore: z.boolean(),
  score: nonNegativeIntegerSchema,
  scoreMax: z.number().int().positive(),
  allowRetry: z.boolean(),
})

const matchStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("MATCH"),
  title: z.string(),
  guide: z.string(),
  pairs: z
    .array(
      z.object({
        left: z.string(),
        right: z.string(),
      })
    )
    .min(1),
  explanation: z.string(),
})

const categorizeStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("CATEGORIZE"),
  title: z.string(),
  guide: z.string(),
  categories: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
      })
    )
    .min(1),
  items: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        categoryId: z.string(),
      })
    )
    .min(1),
  explanation: z.string(),
})

export const lessonStepDtoSchema = z.discriminatedUnion("type", [
  readingStepDtoSchema,
  compareStepDtoSchema,
  multipleChoiceStepDtoSchema,
  fillBlankStepDtoSchema,
  selectStepDtoSchema,
  orderStepDtoSchema,
  writeStepDtoSchema,
  aiFeedbackStepDtoSchema,
  matchStepDtoSchema,
  categorizeStepDtoSchema,
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
