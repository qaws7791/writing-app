import { z } from "zod"

import {
  labeledTextSchema,
  lessonStepBaseSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const compareStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("COMPARE"),
  title: z.string(),
  versions: z.array(labeledTextSchema).min(2),
  analysis: z.string(),
})
