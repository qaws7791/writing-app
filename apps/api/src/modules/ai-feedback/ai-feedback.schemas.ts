import {
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
  answer: z.string().trim().min(1),
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
})

export {
  aiFeedbackResultDtoSchema,
  createAiFeedbackCommandSchema,
  learnerIdSchema,
}
