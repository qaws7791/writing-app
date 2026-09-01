import { z } from "zod"

import {
  compareVersionLabelSchema,
  compareVersionTextSchema,
  stepTitleSchema,
} from "#contracts/content/authoring/authoring-text-schemas"
import { lessonStepBaseSchema } from "#contracts/content/steps/lesson-step-fields"

const compareVersionSchema = z.strictObject({
  label: compareVersionLabelSchema,
  text: compareVersionTextSchema,
})

export const compareStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("COMPARE"),
  title: stepTitleSchema,
  versions: z.array(compareVersionSchema).min(2),
})
