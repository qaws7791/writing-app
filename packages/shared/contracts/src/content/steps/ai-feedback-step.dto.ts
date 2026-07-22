import { z } from "zod"

import { lessonStepIdSchema } from "#contracts/content/ids"
import {
  lessonStepBaseSchema,
  nonNegativeIntegerSchema,
} from "#contracts/content/steps/lesson-step-fields"

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
