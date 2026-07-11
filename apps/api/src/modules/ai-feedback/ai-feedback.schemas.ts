import {
  aiFeedbackAnswerMaxLength,
  aiFeedbackIdempotencyKeySchema,
  aiFeedbackResultDtoSchema,
  createAiFeedbackCommandSchema,
} from "@workspace/contracts/ai-feedback"
import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content"
import { learnerIdSchema } from "@workspace/contracts/learning"
import { z } from "@workspace/hono/zod"

export const createFeedbackBodySchema = z.object({
  answer: z.string().trim().min(1).max(aiFeedbackAnswerMaxLength),
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
})

export const createFeedbackHeadersSchema = z.object({
  "idempotency-key": aiFeedbackIdempotencyKeySchema.optional(),
})

export {
  aiFeedbackResultDtoSchema,
  createAiFeedbackCommandSchema,
  learnerIdSchema,
}
