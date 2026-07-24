import { z } from "zod"

import {
  lessonStepBaseSchema,
  optionalTextSchema,
} from "#contracts/content/steps/lesson-step-fields"
import { contentAssetIdSchema } from "#contracts/content/ids"

export const readingStepDtoSchema = lessonStepBaseSchema.extend({
  body: z.string(),
  guide: z.string(),
  illustrationAssetId: contentAssetIdSchema.optional(),
  source: optionalTextSchema,
  title: z.string(),
  type: z.literal("READING"),
})
