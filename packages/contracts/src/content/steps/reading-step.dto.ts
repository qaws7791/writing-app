import { z } from "zod"

import {
  lessonStepBaseSchema,
  optionalTextSchema,
} from "@workspace/contracts/content/steps/lesson-step-fields"

export const readingStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("READING"),
  title: z.string(),
  guide: z.string(),
  body: z.string(),
  source: optionalTextSchema,
})
