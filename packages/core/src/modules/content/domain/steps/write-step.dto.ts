import { z } from "zod"

import {
  lessonStepBaseSchema,
  nonNegativeIntegerSchema,
  optionalTextSchema,
} from "@workspace/core/modules/content/domain/steps/lesson-step-fields"

export const writeStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("WRITE"),
  title: optionalTextSchema,
  guide: optionalTextSchema,
  min: nonNegativeIntegerSchema,
  goal: nonNegativeIntegerSchema.optional(),
  max: nonNegativeIntegerSchema.optional(),
  badge: optionalTextSchema,
  claim: optionalTextSchema,
  context: optionalTextSchema,
  mode: optionalTextSchema,
  placeholder: optionalTextSchema,
  prompt: optionalTextSchema,
  reference: optionalTextSchema,
  sample: optionalTextSchema,
  structure: optionalTextSchema,
  topic: optionalTextSchema,
  draft: z.boolean().optional(),
})
