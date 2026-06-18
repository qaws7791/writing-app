import { z } from "zod"

import {
  lessonStepBaseSchema,
  optionalTextSchema,
} from "@workspace/core/modules/content/domain/steps/lesson-step-fields"

export const readingStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("READING"),
  title: z.string(),
  guide: z.string(),
  body: z.string(),
  source: optionalTextSchema,
})
