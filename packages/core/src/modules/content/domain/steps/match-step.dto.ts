import { z } from "zod"

import { lessonStepBaseSchema } from "@workspace/core/modules/content/domain/steps/lesson-step-fields"

export const matchStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("MATCH"),
  title: z.string(),
  guide: z.string(),
  pairs: z
    .array(
      z.object({
        left: z.string(),
        right: z.string(),
      })
    )
    .min(1),
  explanation: z.string(),
})
