import { z } from "zod"

import { lessonStepBaseSchema } from "#contracts/content/steps/lesson-step-fields"

export const trueFalseStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("TRUE_FALSE"),
  question: z.string(),
  statement: z.string(),
  correct: z.boolean(),
  explanation: z.string(),
})
