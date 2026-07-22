import { aiFeedbackIdempotencyKeySchema } from "#contracts/ai-feedback/feedback"
import { courseIdSchema, lessonIdSchema } from "#contracts/content/ids"
import { userIdSchema } from "#contracts/identity/admin-ids"
import { learnerAccountStatusSchema } from "#contracts/identity/status"
import {
  learnerCourseCategoriesSchema,
  learnerCourseDetailSchema,
  learnerCourseListQuerySchema,
  learnerCoursePageSchema,
  learnerLessonSchema,
  learnerProgressListQuerySchema,
  learnerProgressPageSchema,
} from "#contracts/learning/learner-content"
import { learnerProfileStatsDtoSchema } from "#contracts/learning/learner-read-model"
import {
  completeLearnerStepResponseSchema,
  learnerAiFeedbackTransitionResultSchema,
  startLearnerLessonResponseSchema,
} from "#contracts/learning/learner-transition"
import { z } from "zod"

export const learnerUserSchema = z.strictObject({
  email: z.email(),
  id: userIdSchema,
  image: z.string().nullable(),
  joinedAt: z.string().datetime(),
  name: z.string(),
  status: learnerAccountStatusSchema,
})

export const learnerProfileResponseSchema = z.strictObject({
  stats: learnerProfileStatsDtoSchema,
  user: learnerUserSchema,
})

export const learnerSessionResponseSchema = z.strictObject({
  user: learnerUserSchema,
})

export const learnerProgressResponseSchema = learnerProgressPageSchema
export const learnerCourseListResponseSchema = learnerCoursePageSchema
export const learnerCourseDetailResponseSchema = learnerCourseDetailSchema
export const learnerLessonResponseSchema = learnerLessonSchema
export const learnerCourseCategoriesResponseSchema =
  learnerCourseCategoriesSchema
export const learnerStartLessonResponseSchema = startLearnerLessonResponseSchema
export const learnerCompleteStepResponseSchema =
  completeLearnerStepResponseSchema
export const learnerAiFeedbackTransitionResponseSchema =
  learnerAiFeedbackTransitionResultSchema

export const learnerCourseParamsSchema = z.strictObject({
  courseId: courseIdSchema,
})

export const learnerLessonParamsSchema = z.strictObject({
  lessonId: lessonIdSchema,
})

export const learnerCourseQuerySchema = learnerCourseListQuerySchema
export const learnerProgressQuerySchema = learnerProgressListQuerySchema

export const createLearnerAiFeedbackTransitionHeadersSchema = z.looseObject({
  "idempotency-key": aiFeedbackIdempotencyKeySchema,
})

export type LearnerProfileResponse = z.infer<
  typeof learnerProfileResponseSchema
>
export type LearnerSessionResponse = z.infer<
  typeof learnerSessionResponseSchema
>
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
