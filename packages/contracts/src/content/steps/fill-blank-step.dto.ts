import { z } from "zod"

import { lessonStepBaseSchema } from "@workspace/contracts/content/steps/lesson-step-fields"

export const fillBlankStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("FILL_BLANK"),
  template: z.string(),
  words: z.array(z.string()).min(1),
  answer: z.array(z.string()).min(1),
  explanation: z.string(),
})
