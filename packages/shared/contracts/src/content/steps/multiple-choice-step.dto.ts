import { z } from "zod"

import { lessonStepBaseSchema } from "#contracts/content/steps/lesson-step-fields"

export const multipleChoiceStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("MULTIPLE_CHOICE"),
  question: z.string(),
  options: z
    .array(
      z.strictObject({
        id: z.string(),
        text: z.string(),
      })
    )
    .min(2),
  correct: z.string(),
  explanation: z.string(),
  wrong: z.string().optional(),
})
