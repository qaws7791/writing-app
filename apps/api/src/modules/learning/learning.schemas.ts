import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/core/modules/content"
import {
  learningAnswerSchema,
  learnerIdSchema,
} from "@workspace/core/modules/learning"
import { z } from "@workspace/hono/zod"

export const saveAnswerBodySchema = z.object({
  answer: learningAnswerSchema,
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
})

export const completeLessonParamsSchema = z.object({
  lessonId: lessonIdSchema,
})

export const completeLessonBodySchema = z.object({
  currentStepIndex: z.number().int().nonnegative(),
})

export { learnerIdSchema }
