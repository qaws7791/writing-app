import { z } from "zod"

import { lessonStepIdSchema } from "#contracts/content/ids"
import { lessonStepBaseSchema } from "#contracts/content/steps/lesson-step-fields"

export const aiFeedbackStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("AI_FEEDBACK"),
  target: lessonStepIdSchema,
  focus: z.string(),
  feedback: z.string(),
  allowRetry: z.boolean(),
})
