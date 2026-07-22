import { z } from "zod"
import { aiFeedbackPublicErrorCodeValues } from "#contracts/ai-feedback/feedback"

export const learnerApiErrorCodeValues = [
  "VALIDATION_ERROR",
  "INVALID_CURSOR",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "LESSON_LOCKED",
  "COURSE_NOT_FOUND",
  "LESSON_NOT_FOUND",
  "NOT_FOUND",
  "STEP_SEQUENCE_CONFLICT",
  "CURRICULUM_VERSION_CHANGED",
  ...aiFeedbackPublicErrorCodeValues,
  "AI_FEEDBACK_ANSWER_NOT_FOUND",
  "INTERNAL_SERVER_ERROR",
] as const

export const learnerApiErrorCodeSchema = z.enum(learnerApiErrorCodeValues)

const learnerApiStandardErrorCodeSchema = z.enum([
  "INVALID_CURSOR",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "LESSON_LOCKED",
  "COURSE_NOT_FOUND",
  "LESSON_NOT_FOUND",
  "NOT_FOUND",
  "STEP_SEQUENCE_CONFLICT",
  "CURRICULUM_VERSION_CHANGED",
  ...aiFeedbackPublicErrorCodeValues,
  "AI_FEEDBACK_ANSWER_NOT_FOUND",
  "INTERNAL_SERVER_ERROR",
])

export const learnerApiStandardErrorSchema = z.strictObject({
  code: learnerApiStandardErrorCodeSchema,
  message: z.string(),
  requestId: z.string().min(1),
})

export const learnerApiValidationErrorSchema = z.strictObject({
  code: z.literal("VALIDATION_ERROR"),
  message: z.string(),
  requestId: z.string().min(1),
  violations: z.array(
    z.strictObject({
      message: z.string(),
      path: z.string(),
    })
  ),
})

export const learnerApiErrorSchema = z.union([
  learnerApiValidationErrorSchema,
  learnerApiStandardErrorSchema,
])

export type LearnerApiErrorCode = z.infer<typeof learnerApiErrorCodeSchema>
export type LearnerApiError = z.infer<typeof learnerApiErrorSchema>
export type LearnerApiValidationError = z.infer<
  typeof learnerApiValidationErrorSchema
>
