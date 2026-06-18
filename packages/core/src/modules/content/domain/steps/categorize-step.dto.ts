import { z } from "zod"

import { lessonStepBaseSchema } from "@workspace/core/modules/content/domain/steps/lesson-step-fields"

export const categorizeStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("CATEGORIZE"),
  title: z.string(),
  guide: z.string(),
  categories: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
      })
    )
    .min(1),
  items: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        categoryId: z.string(),
      })
    )
    .min(1),
  explanation: z.string(),
})
