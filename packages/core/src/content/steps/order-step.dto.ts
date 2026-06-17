import { z } from "zod"

import { lessonStepBaseSchema } from "@workspace/core/content/steps/lesson-step-fields"

export const orderStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("ORDER"),
  title: z.string(),
  items: z.array(z.string()).min(1),
  correct: z.array(z.string()).min(1),
  showNumbers: z.boolean().optional(),
  explanation: z.string(),
})
