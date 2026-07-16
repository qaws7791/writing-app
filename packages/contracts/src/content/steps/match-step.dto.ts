import { z } from "zod"

import { lessonStepBaseSchema } from "@workspace/contracts/content/steps/lesson-step-fields"

export const matchStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("MATCH"),
  title: z.string(),
  guide: z.string(),
  pairs: z
    .array(
      z.strictObject({
        left: z.string(),
        leftId: z.string().optional(),
        right: z.string(),
        rightId: z.string().optional(),
      })
    )
    .min(1),
  explanation: z.string(),
})
