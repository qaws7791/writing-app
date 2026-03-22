import { z } from "zod"

import {
  promptLengthLabelSchema,
  promptLevelSchema,
  promptTopicSchema,
  promptTopics,
} from "../../shared/schema/index"

export const promptIdParamSchema = z.coerce.number().int().positive()

const promptSummaryBaseSchema = z.object({
  id: z.number().int(),
  level: promptLevelSchema,
  saved: z.boolean(),
  suggestedLengthLabel: promptLengthLabelSchema,
  tags: z.array(z.string()).readonly(),
  text: z.string(),
  topic: promptTopicSchema,
})

export const promptSummarySchema = promptSummaryBaseSchema.readonly()

export const promptDetailSchema = promptSummaryBaseSchema
  .extend({
    description: z.string(),
    outline: z.array(z.string()).readonly(),
    tips: z.array(z.string()).readonly(),
  })
  .readonly()

export const promptFiltersQuerySchema = z.object({
  level: z
    .preprocess(
      (value) => (value === undefined ? undefined : Number(value)),
      promptLevelSchema
    )
    .optional(),
  query: z.string().trim().min(1).optional(),
  saved: z
    .enum(["false", "true"])
    .transform((value) => value === "true")
    .optional(),
  topic: z.enum(promptTopics).optional(),
})

export const promptListResponseSchema = z.object({
  items: z.array(promptSummarySchema).readonly(),
})

export const promptSaveResponseSchema = z.object({
  kind: z.literal("saved"),
  savedAt: z.string(),
})
