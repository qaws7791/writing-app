import { z } from "zod"

import { writingContentSchema } from "../../shared/schema/index"

export const writingIdParamSchema = z.coerce.number().int().positive()

const writingSummaryBaseSchema = z.object({
  characterCount: z.number().int(),
  id: z.number().int(),
  lastSavedAt: z.string(),
  preview: z.string(),
  sourcePromptId: z.number().int().nullable(),
  title: z.string(),
  wordCount: z.number().int(),
})

export const writingSummarySchema = writingSummaryBaseSchema.readonly()

export const writingDetailSchema = writingSummaryBaseSchema
  .extend({
    content: writingContentSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .readonly()

export const createWritingBodySchema = z
  .object({
    content: writingContentSchema.optional(),
    sourcePromptId: z.number().int().positive().optional(),
    title: z.string().max(200).optional(),
  })
  .strict()

export const autosaveWritingBodySchema = z
  .object({
    content: writingContentSchema.optional(),
    title: z.string().max(200).optional(),
  })
  .strict()
  .refine((value) => value.title !== undefined || value.content !== undefined, {
    message: "변경할 제목 또는 본문이 필요합니다.",
  })

export const writingListResponseSchema = z.object({
  items: z.array(writingSummarySchema).readonly(),
})

export const autosaveWritingResponseSchema = z.object({
  writing: writingDetailSchema,
  kind: z.literal("autosaved"),
})
