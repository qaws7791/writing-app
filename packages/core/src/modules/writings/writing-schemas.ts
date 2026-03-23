import { z } from "zod"

import { draftContentSchema } from "../../shared/schema/index"

// --- Operation schemas ---

const operationSchema = z.union([
  z.object({
    type: z.literal("setTitle"),
    title: z.string().max(200),
  }),
  z.object({
    type: z.literal("setContent"),
    content: draftContentSchema,
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
    serverContent: draftContentSchema,
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
  content: draftContentSchema,
  lastSavedAt: z.string(),
  hasNewerVersion: z.boolean(),
})

// --- Version History ---

export const writingVersionSummarySchema = z.object({
  id: z.number().int(),
  draftId: z.number().int(),
  version: z.number().int(),
  title: z.string(),
  createdAt: z.string(),
  reason: z.enum(["auto", "manual", "restore"]),
})

export const writingVersionDetailSchema = writingVersionSummarySchema.extend({
  content: draftContentSchema,
})

export const versionListResponseSchema = z.object({
  items: z.array(writingVersionSummarySchema).readonly(),
})

// --- Param schemas ---

export const writingIdParamSchema = z.coerce.number().int().positive()
export const versionParamSchema = z.coerce.number().int().positive()
