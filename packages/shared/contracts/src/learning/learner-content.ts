import { z } from "zod"

import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "#contracts/content/ids"
import { courseVisualKeySchema } from "#contracts/content/course"
import {
  nonNegativeIntegerSchema,
  positiveSortOrderSchema,
} from "#contracts/content/steps/lesson-step-fields"
import { lessonStepItemIdSchema } from "#contracts/learning/ids"
import { contentStatusSchema } from "#contracts/content/status"

export const curriculumVersionRefSchema = z.strictObject({
  curriculumVersionId: curriculumVersionIdSchema,
  revision: z.number().int().positive(),
})

export const learnerLessonReferenceSchema = z.strictObject({
  currentStepId: lessonStepIdSchema,
  currentStepIndex: nonNegativeIntegerSchema,
  estimatedMinutes: z.number().int().positive(),
  id: lessonIdSchema,
  title: z.string(),
})

const courseLearningStateBaseSchema = z.strictObject({
  completedLessons: nonNegativeIntegerSchema,
  progressPercent: z.number().int().min(0).max(100),
  totalLessons: nonNegativeIntegerSchema,
  version: curriculumVersionRefSchema,
})

export const courseLearningStateSchema = z.discriminatedUnion("status", [
  courseLearningStateBaseSchema.extend({
    completedLessons: z.literal(0),
    nextLesson: learnerLessonReferenceSchema,
    progressPercent: z.literal(0),
    status: z.literal("not_started"),
  }),
  courseLearningStateBaseSchema.extend({
    lastActivityAt: z.string().datetime(),
    nextLesson: learnerLessonReferenceSchema,
    status: z.literal("in_progress"),
  }),
  courseLearningStateBaseSchema.extend({
    completedAt: z.string().datetime(),
    lastActivityAt: z.string().datetime(),
    nextLesson: z.null(),
    progressPercent: z.literal(100),
    status: z.literal("completed"),
  }),
])

export const lessonCompletionSchema = z.strictObject({
  completedAt: z.string().datetime(),
  totalSteps: nonNegativeIntegerSchema,
})

export const lockedLessonLearningStateSchema = z.strictObject({
  status: z.literal("locked"),
  version: curriculumVersionRefSchema,
})

export const notStartedLessonLearningStateSchema = z.strictObject({
  status: z.literal("not_started"),
  totalSteps: nonNegativeIntegerSchema,
  version: curriculumVersionRefSchema,
})

export const inProgressLessonLearningStateSchema = z.strictObject({
  completedSteps: nonNegativeIntegerSchema,
  currentStepId: lessonStepIdSchema,
  currentStepIndex: nonNegativeIntegerSchema,
  progressPercent: z.number().int().min(0).max(100),
  status: z.literal("in_progress"),
  totalSteps: nonNegativeIntegerSchema,
  version: curriculumVersionRefSchema,
})

export const completedLessonLearningStateSchema = z.strictObject({
  completion: lessonCompletionSchema,
  status: z.literal("completed"),
  version: curriculumVersionRefSchema,
})

export const lessonLearningStateSchema = z.discriminatedUnion("status", [
  lockedLessonLearningStateSchema,
  notStartedLessonLearningStateSchema,
  inProgressLessonLearningStateSchema,
  completedLessonLearningStateSchema,
])

const learnerStepBaseSchema = z.strictObject({
  id: lessonStepIdSchema,
  sortOrder: positiveSortOrderSchema,
})

const learnerStepItemSchema = z.strictObject({
  id: lessonStepItemIdSchema,
  text: z.string(),
})

const learnerReadingStepSchema = learnerStepBaseSchema.extend({
  body: z.string(),
  guide: z.string(),
  source: z.string().optional(),
  title: z.string(),
  type: z.literal("READING"),
})

const learnerCompareStepSchema = learnerStepBaseSchema.extend({
  title: z.string(),
  type: z.literal("COMPARE"),
  versions: z
    .array(z.strictObject({ label: z.string(), text: z.string() }))
    .min(2),
})

const learnerMultipleChoiceStepSchema = learnerStepBaseSchema.extend({
  options: z.array(learnerStepItemSchema).min(2),
  question: z.string(),
  type: z.literal("MULTIPLE_CHOICE"),
})

const learnerFillBlankStepSchema = learnerStepBaseSchema.extend({
  blankCount: z.number().int().positive(),
  choices: z.array(learnerStepItemSchema).min(1),
  template: z.string(),
  type: z.literal("FILL_BLANK"),
})

const learnerSelectStepSchema = learnerStepBaseSchema.extend({
  items: z.array(learnerStepItemSchema).min(1),
  layout: z.string().optional(),
  question: z.string(),
  type: z.literal("SELECT"),
})

const learnerOrderStepSchema = learnerStepBaseSchema.extend({
  items: z.array(learnerStepItemSchema).min(1),
  showNumbers: z.boolean().optional(),
  title: z.string(),
  type: z.literal("ORDER"),
})

const learnerWriteStepSchema = learnerStepBaseSchema.extend({
  badge: z.string().optional(),
  claim: z.string().optional(),
  context: z.string().optional(),
  draft: z.boolean().optional(),
  goal: nonNegativeIntegerSchema.optional(),
  guide: z.string().optional(),
  max: nonNegativeIntegerSchema.optional(),
  min: nonNegativeIntegerSchema,
  mode: z.string().optional(),
  placeholder: z.string().optional(),
  prompt: z.string().optional(),
  reference: z.string().optional(),
  sample: z.string().optional(),
  structure: z.string().optional(),
  title: z.string().optional(),
  topic: z.string().optional(),
  type: z.literal("WRITE"),
})

const learnerAiFeedbackStepSchema = learnerStepBaseSchema.extend({
  focus: z.string(),
  target: lessonStepIdSchema,
  type: z.literal("AI_FEEDBACK"),
})

const learnerMatchStepSchema = learnerStepBaseSchema.extend({
  guide: z.string(),
  leftItems: z.array(learnerStepItemSchema).min(1),
  rightItems: z.array(learnerStepItemSchema).min(1),
  title: z.string(),
  type: z.literal("MATCH"),
})

const learnerCategorizeStepSchema = learnerStepBaseSchema.extend({
  categories: z.array(learnerStepItemSchema).min(1),
  guide: z.string(),
  items: z.array(learnerStepItemSchema).min(1),
  title: z.string(),
  type: z.literal("CATEGORIZE"),
})

export const learnerLessonStepSchema = z.discriminatedUnion("type", [
  learnerReadingStepSchema,
  learnerCompareStepSchema,
  learnerMultipleChoiceStepSchema,
  learnerFillBlankStepSchema,
  learnerSelectStepSchema,
  learnerOrderStepSchema,
  learnerWriteStepSchema,
  learnerAiFeedbackStepSchema,
  learnerMatchStepSchema,
  learnerCategorizeStepSchema,
])

export const learnerCourseSummarySchema = z.strictObject({
  category: z.string(),
  contentStatus: contentStatusSchema,
  description: z.string(),
  id: courseIdSchema,
  lessonCount: nonNegativeIntegerSchema,
  title: z.string(),
  version: curriculumVersionRefSchema,
  visualKey: courseVisualKeySchema,
})

export const learnerCourseLessonSchema = z.strictObject({
  category: z.string().nullable(),
  contentStatus: contentStatusSchema,
  description: z.string().nullable(),
  estimatedMinutes: z.number().int().positive(),
  id: lessonIdSchema,
  learning: lessonLearningStateSchema,
  sortOrder: positiveSortOrderSchema,
  title: z.string(),
})

export const learnerCourseUnitSchema = z.strictObject({
  id: unitIdSchema,
  lessons: z.array(learnerCourseLessonSchema),
  sortOrder: positiveSortOrderSchema,
  title: z.string(),
})

export const learnerCourseDetailSchema = learnerCourseSummarySchema.extend({
  learning: courseLearningStateSchema,
  units: z.array(learnerCourseUnitSchema),
})

export const learnerLessonSchema = z.strictObject({
  category: z.string().nullable(),
  courseId: courseIdSchema,
  description: z.string().nullable(),
  estimatedMinutes: z.number().int().positive(),
  id: lessonIdSchema,
  learning: lessonLearningStateSchema,
  steps: z.array(learnerLessonStepSchema),
  summary: z.array(z.string()),
  title: z.string(),
  unitId: unitIdSchema,
  version: curriculumVersionRefSchema,
})

export const learnerProgressCourseSchema = z.strictObject({
  id: courseIdSchema,
  learning: courseLearningStateSchema,
  title: z.string(),
  visualKey: courseVisualKeySchema,
})

export function createCursorPageSchema<TItem extends z.ZodType>(
  itemSchema: TItem
) {
  return z.strictObject({
    items: z.array(itemSchema),
    nextCursor: z.string().min(1).nullable(),
  })
}

export const learnerCoursePageSchema = createCursorPageSchema(
  learnerCourseSummarySchema
)
export const learnerProgressPageSchema = createCursorPageSchema(
  learnerProgressCourseSchema
)
export const learnerCourseCategoriesSchema = z.array(z.string())

export const learnerCourseSortValues = [
  "recommended",
  "title-asc",
  "title-desc",
  "lesson-count-asc",
  "lesson-count-desc",
] as const
export const learnerCourseSortSchema = z.enum(learnerCourseSortValues)

const cursorListQueryFields = {
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}

export const learnerCourseListQuerySchema = z.strictObject({
  ...cursorListQueryFields,
  category: z.string().min(1).optional(),
  query: z.string().trim().min(1).max(100).optional(),
  sort: learnerCourseSortSchema.default("recommended"),
})

export const learnerProgressListQuerySchema = z.strictObject({
  ...cursorListQueryFields,
  status: z.enum(["in_progress", "completed"]).optional(),
})

export type CurriculumVersionRef = z.infer<typeof curriculumVersionRefSchema>
export type LearnerLessonReference = z.infer<
  typeof learnerLessonReferenceSchema
>
export type CourseLearningState = z.infer<typeof courseLearningStateSchema>
export type LessonLearningState = z.infer<typeof lessonLearningStateSchema>
export type LearnerLessonStep = z.infer<typeof learnerLessonStepSchema>
export type LearnerCourseSummary = z.infer<typeof learnerCourseSummarySchema>
export type LearnerCourseDetail = z.infer<typeof learnerCourseDetailSchema>
export type LearnerLesson = z.infer<typeof learnerLessonSchema>
export type LearnerProgressCourse = z.infer<typeof learnerProgressCourseSchema>
export type LearnerCoursePage = z.infer<typeof learnerCoursePageSchema>
export type LearnerProgressPage = z.infer<typeof learnerProgressPageSchema>
export type LearnerCourseSort = z.infer<typeof learnerCourseSortSchema>
export type LearnerCourseListQuery = z.infer<
  typeof learnerCourseListQuerySchema
>
export type LearnerProgressListQuery = z.infer<
  typeof learnerProgressListQuerySchema
>
