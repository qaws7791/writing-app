import { z } from "zod"

import {
  readingBodySchema,
  readingGuideSchema,
  readingTitleSchema,
} from "#contracts/content/authoring/authoring-text-schemas"
import { contentAssetIdSchema } from "#contracts/content/ids"
import {
  lessonStepBaseSchema,
  optionalTextSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const readingStepDtoSchema = lessonStepBaseSchema.extend({
  body: readingBodySchema,
  guide: readingGuideSchema,
  illustrationAssetId: contentAssetIdSchema.optional(),
  source: optionalTextSchema,
  title: readingTitleSchema,
  type: z.literal("READING"),
})
