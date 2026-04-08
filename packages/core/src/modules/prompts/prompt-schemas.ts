import { z } from "zod"

export const promptTypeSchema = z.enum(["sensory", "reflection", "opinion"])

export const promptIdParamSchema = z.coerce.number().int().positive()

export const promptSummarySchema = z
  .object({
    id: z.number().int(),
    promptType: promptTypeSchema,
    title: z.string(),
    body: z.string(),
    thumbnailUrl: z.string(),
    responseCount: z.number().int(),
    isBookmarked: z.boolean(),
  })
  .readonly()

export const promptListPageResponseSchema = z.object({
  items: z.array(promptSummarySchema).readonly(),
  nextCursor: z.number().int().nullable(),
})

export const promptFiltersQuerySchema = z.object({
  promptType: promptTypeSchema.optional(),
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

export const promptCategorySchema = z.object({
  key: promptTypeSchema,
  label: z.string(),
})

export const promptCategoriesResponseSchema = z.object({
  items: z.array(promptCategorySchema),
})

export const promptBookmarkResponseSchema = z.object({
  kind: z.literal("bookmarked"),
  savedAt: z.string(),
})
