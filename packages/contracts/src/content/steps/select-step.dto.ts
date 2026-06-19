import { z } from "zod"

import {
  lessonStepBaseSchema,
  nonNegativeIntegerSchema,
  optionalTextSchema,
} from "@workspace/contracts/content/steps/lesson-step-fields"

export const selectStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("SELECT"),
  question: z.string(),
  segments: z.array(z.string()).min(1),
  correct: z.array(nonNegativeIntegerSchema).min(1),
  explanation: z.string(),
  layout: optionalTextSchema,
})
