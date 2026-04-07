import { z } from "zod"

export const promptTypeSchema = z.enum(["sensory", "reflection", "opinion"])

export const promptIdParamSchema = z.coerce.number().int().positive()

export const promptSummarySchema = z
  .object({
    id: z.number().int(),
    promptType: promptTypeSchema,
    title: z.string(),
    body: z.string(),
    responseCount: z.number().int(),
    isBookmarked: z.boolean(),
  })
  .readonly()

export const promptListResponseSchema = z.object({
  items: z.array(promptSummarySchema),
})

export const promptFiltersQuerySchema = z.object({
  promptType: promptTypeSchema.optional(),
})

export const promptBookmarkResponseSchema = z.object({
  kind: z.literal("bookmarked"),
  savedAt: z.string(),
})
