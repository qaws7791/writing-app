import { z } from "zod"

import { draftContentSchema } from "../../shared/schema/index"

export const draftIdParamSchema = z.coerce.number().int().positive()

const draftSummaryBaseSchema = z.object({
  characterCount: z.number().int(),
  id: z.number().int(),
  lastSavedAt: z.string(),
  preview: z.string(),
  sourcePromptId: z.number().int().nullable(),
  title: z.string(),
  wordCount: z.number().int(),
})

export const draftSummarySchema = draftSummaryBaseSchema.readonly()

export const draftDetailSchema = draftSummaryBaseSchema
  .extend({
    content: draftContentSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .readonly()

export const createDraftBodySchema = z
  .object({
    content: draftContentSchema.optional(),
    sourcePromptId: z.number().int().positive().optional(),
    title: z.string().max(200).optional(),
  })
  .strict()

export const autosaveDraftBodySchema = z
  .object({
    content: draftContentSchema.optional(),
    title: z.string().max(200).optional(),
  })
  .strict()
  .refine((value) => value.title !== undefined || value.content !== undefined, {
    message: "변경할 제목 또는 본문이 필요합니다.",
  })

export const draftListResponseSchema = z.object({
  items: z.array(draftSummarySchema).readonly(),
})

export const autosaveDraftResponseSchema = z.object({
  draft: draftDetailSchema,
  kind: z.literal("autosaved"),
})
