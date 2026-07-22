import { z } from "zod"

import { lessonStepBaseSchema } from "#contracts/content/steps/lesson-step-fields"

export const fillBlankStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("FILL_BLANK"),
  template: z.string(),
  words: z.array(z.string()).min(1),
  wordIds: z.array(z.string()).min(1).optional(),
  answer: z.array(z.string()).min(1),
  explanation: z.string(),
})
