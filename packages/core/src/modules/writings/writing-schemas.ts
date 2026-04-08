import { z } from "zod"

import {
  cursorPageQuerySchema,
  cursorPageResponseSchema,
} from "../../shared/pagination/index"

const writingSummaryBaseSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  preview: z.string(),
  wordCount: z.number().int(),
  sourcePromptId: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const writingSummarySchema = writingSummaryBaseSchema.readonly()

export const writingDetailSchema = writingSummaryBaseSchema
  .extend({
    bodyJson: z.unknown(),
    bodyPlainText: z.string(),
  })
  .readonly()

export const writingIdParamSchema = z.coerce.number().int().positive()

export const createWritingBodySchema = z
  .object({
    title: z.string().max(200).optional(),
    bodyJson: z.unknown().optional(),
    bodyPlainText: z.string().optional(),
    wordCount: z.number().int().min(0).optional(),
    sourcePromptId: z.number().int().positive().optional(),
  })
  .strict()

export const autosaveWritingBodySchema = z
  .object({
    title: z.string().max(200).optional(),
    bodyJson: z.unknown().optional(),
    bodyPlainText: z.string().optional(),
    wordCount: z.number().int().min(0).optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.title !== undefined ||
      v.bodyJson !== undefined ||
      v.bodyPlainText !== undefined,
    { message: "변경할 제목 또는 본문이 필요합니다." }
  )

export const writingListResponseSchema = z.object({
  items: z.array(writingSummarySchema),
  nextCursor: z.string().nullable(),
})

export const autosaveWritingResponseSchema = z.object({
  kind: z.literal("autosaved"),
  writing: writingDetailSchema,
})

export const publicWritingSummarySchema = z
  .object({
    id: z.number().int(),
    title: z.string(),
    preview: z.string(),
    wordCount: z.number().int(),
    createdAt: z.string(),
    isOwner: z.boolean(),
  })
  .readonly()

export const promptWritingsQuerySchema = cursorPageQuerySchema

export const promptWritingsResponseSchema = cursorPageResponseSchema(
  publicWritingSummarySchema
)
