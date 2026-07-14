import {
  aiFeedbackIdempotencyKeySchema,
  aiFeedbackResultDtoSchema,
  createAiFeedbackRequestCommandSchema,
} from "@workspace/contracts/ai-feedback"
import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content"
import { learnerIdSchema } from "@workspace/contracts/learning"
import { z } from "@workspace/hono/zod"

export const createFeedbackBodySchema = z.object({
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
})

export const createFeedbackHeadersSchema = z.object({
  "idempotency-key": aiFeedbackIdempotencyKeySchema.optional(),
})

export {
  aiFeedbackResultDtoSchema,
  createAiFeedbackRequestCommandSchema,
  learnerIdSchema,
}
