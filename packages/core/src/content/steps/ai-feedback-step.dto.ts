import { z } from "zod"

import {
  lessonStepBaseSchema,
  nonNegativeIntegerSchema,
} from "@workspace/core/content/steps/lesson-step-fields"

export const aiFeedbackStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("AI_FEEDBACK"),
  target: z.string(),
  focus: z.string(),
  feedback: z.string(),
  showScore: z.boolean(),
  score: nonNegativeIntegerSchema,
  scoreMax: z.number().int().positive(),
  allowRetry: z.boolean(),
})
