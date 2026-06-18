import {
  aiFeedbackResultDtoSchema,
  createAiFeedbackCommandSchema,
} from "@workspace/core/modules/ai-feedback"
import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/core/modules/content"
import { learnerIdSchema } from "@workspace/core/modules/learning"
import { z } from "@workspace/hono/zod"

export const createFeedbackBodySchema = z.object({
  answer: z.string().trim().min(1),
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
})

export {
  aiFeedbackResultDtoSchema,
  createAiFeedbackCommandSchema,
  learnerIdSchema,
}
