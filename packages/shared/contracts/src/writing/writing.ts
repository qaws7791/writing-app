import { z } from "zod"
import type { WritingId } from "@workspace/types/ids"

import { createIdentifierSchema } from "#contracts/identifier"
import { nonNegativeIntegerSchema } from "#contracts/shared/integer"

export type { WritingId } from "@workspace/types/ids"

export const writingIdSchema = createIdentifierSchema<WritingId>()
export const writingModeSchema = z.enum(["free", "explain", "argue"])
export const writingStatusSchema = z.enum(["drafting", "checked"])

export const writingParamsSchema = z.strictObject({
  writingId: writingIdSchema,
})

export const writingSummarySchema = z.strictObject({
  id: writingIdSchema,
  mode: writingModeSchema,
  status: writingStatusSchema,
  title: z.string(),
  updatedAt: z.iso.datetime(),
  version: nonNegativeIntegerSchema,
})

export const writingDetailSchema = writingSummarySchema.extend({
  body: z.string(),
  checkedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  selfCheckStartedAt: z.iso.datetime().nullable(),
})

export const writingListResponseSchema = z.strictObject({
  items: z.array(writingSummarySchema),
})

export const createWritingBodySchema = z.strictObject({
  mode: writingModeSchema,
})

export const saveWritingBodySchema = z.strictObject({
  body: z.string(),
  expectedVersion: nonNegativeIntegerSchema,
  title: z.string(),
})

export const writingVersionBodySchema = z.strictObject({
  expectedVersion: nonNegativeIntegerSchema,
})

export const deleteWritingResponseSchema = z.strictObject({
  deleted: z.literal(true),
  id: writingIdSchema,
})

export type WritingMode = z.infer<typeof writingModeSchema>
export type WritingStatus = z.infer<typeof writingStatusSchema>
export type WritingSummaryDto = z.infer<typeof writingSummarySchema>
export type WritingDetailDto = z.infer<typeof writingDetailSchema>
