import { z } from "zod"

import { writingContentSchema } from "../../shared/schema/index"
import { cursorPageResponseSchema } from "../../shared/pagination/index"

// --- Operation schemas ---

const operationSchema = z.union([
  z.object({
    type: z.literal("setTitle"),
    title: z.string().max(200),
  }),
  z.object({
    type: z.literal("setContent"),
    content: writingContentSchema,
  }),
])

// --- Sync Push ---

const transactionSchema = z.object({
  operations: z.array(operationSchema).min(1),
  createdAt: z.string(),
})

export const syncPushBodySchema = z
  .object({
    baseVersion: z.number().int().min(0),
    transactions: z.array(transactionSchema).min(1),
    restoreFrom: z.number().int().positive().optional(),
    snapshotReason: z.literal("manual").optional(),
  })
  .strict()

export const syncPushResponseSchema = z.union([
  z.object({
    accepted: z.literal(true),
    serverVersion: z.number().int(),
  }),
  z.object({
    accepted: z.literal(false),
    serverVersion: z.number().int(),
    serverContent: writingContentSchema,
    serverTitle: z.string(),
  }),
])

// --- Sync Pull ---

export const syncPullQuerySchema = z.object({
  since: z.coerce.number().int().min(0).optional(),
})

export const syncPullResponseSchema = z.object({
  version: z.number().int(),
  title: z.string(),
  content: writingContentSchema,
  lastSavedAt: z.string(),
  hasNewerVersion: z.boolean(),
})

// --- Version History ---

export const writingVersionSummarySchema = z.object({
  id: z.number().int(),
  writingId: z.number().int(),
  version: z.number().int(),
  title: z.string(),
  createdAt: z.string(),
  reason: z.enum(["auto", "manual", "restore"]),
})

export const writingVersionDetailSchema = writingVersionSummarySchema.extend({
  content: writingContentSchema,
})

export const versionListResponseSchema = cursorPageResponseSchema(
  writingVersionSummarySchema
)

// --- Param schemas ---

export const writingIdParamSchema = z.coerce.number().int().positive()
export const versionParamSchema = z.coerce.number().int().positive()

// --- CRUD schemas ---

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

export const writingListResponseSchema =
  cursorPageResponseSchema(writingSummarySchema)

export const autosaveWritingResponseSchema = z.object({
  writing: writingDetailSchema,
  kind: z.literal("autosaved"),
})
