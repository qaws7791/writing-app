import { courseIdSchema, lessonIdSchema } from "#contracts/content/ids"
import {
  learnerCourseCategoriesSchema,
  learnerCourseDetailSchema,
  learnerCourseListQuerySchema,
  learnerCoursePageSchema,
  learnerLessonSchema,
  learnerProgressListQuerySchema,
  learnerProgressPageSchema,
} from "#contracts/learning/learner-content"
import {
  completeLearnerStepResultSchema,
  saveLearnerStepDraftResponseSchema,
  startLearnerLessonResponseSchema,
} from "#contracts/learning/learner-transition"
import { z } from "zod"

export const learnerProgressResponseSchema = learnerProgressPageSchema
export const learnerCourseListResponseSchema = learnerCoursePageSchema
export const learnerCourseDetailResponseSchema = learnerCourseDetailSchema
export const learnerLessonResponseSchema = learnerLessonSchema
export const learnerCourseCategoriesResponseSchema =
  learnerCourseCategoriesSchema
export const learnerStartLessonResponseSchema = startLearnerLessonResponseSchema
export const learnerSaveStepDraftResponseSchema =
  saveLearnerStepDraftResponseSchema
export const learnerCompleteStepResponseSchema = completeLearnerStepResultSchema

export const learnerCourseParamsSchema = z.strictObject({
  courseId: courseIdSchema,
})

export const learnerLessonParamsSchema = z.strictObject({
  lessonId: lessonIdSchema,
})

export const learnerCourseQuerySchema = learnerCourseListQuerySchema
export const learnerProgressQuerySchema = learnerProgressListQuerySchema

export type LearnerProgressResponse = z.infer<
  typeof learnerProgressResponseSchema
>
export type LearnerCourseListResponse = z.infer<
  typeof learnerCourseListResponseSchema
>
export type LearnerCourseDetailResponse = z.infer<
  typeof learnerCourseDetailResponseSchema
>
export type LearnerCourseCategoriesResponse = z.infer<
  typeof learnerCourseCategoriesResponseSchema
>
export type LearnerLessonResponse = z.infer<typeof learnerLessonResponseSchema>
export type LearnerStartLessonResponse = z.infer<
  typeof learnerStartLessonResponseSchema
>
export type LearnerSaveStepDraftResponse = z.infer<
  typeof learnerSaveStepDraftResponseSchema
>
