import { z } from "zod"

import { lessonStepIdSchema } from "@workspace/contracts/content/content.ids"
import {
  lessonStepBaseSchema,
  nonNegativeIntegerSchema,
} from "@workspace/contracts/content/steps/lesson-step-fields"

export const aiFeedbackStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("AI_FEEDBACK"),
  target: lessonStepIdSchema,
  focus: z.string(),
  feedback: z.string(),
  showScore: z.boolean(),
  score: nonNegativeIntegerSchema,
  scoreMax: z.number().int().positive(),
  allowRetry: z.boolean(),
})
