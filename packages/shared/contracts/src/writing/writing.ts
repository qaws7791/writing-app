import { z } from "zod"
import type {
  WritingCheckId,
  WritingId,
  WritingTaskId,
  WritingTaskPublicationId,
} from "@workspace/types/ids"

import { createIdentifierSchema } from "#contracts/identifier"
import {
  nonNegativeIntegerSchema,
  positiveIntegerSchema,
} from "#contracts/shared/integer"

export type { WritingCheckId, WritingId } from "@workspace/types/ids"
export type {
  WritingTaskId,
  WritingTaskPublicationId,
} from "@workspace/types/ids"

export const writingIdSchema = createIdentifierSchema<WritingId>()
export const writingTaskIdSchema = createIdentifierSchema<WritingTaskId>()
export const writingTaskPublicationIdSchema =
  createIdentifierSchema<WritingTaskPublicationId>()
export const writingCheckIdSchema = createIdentifierSchema<WritingCheckId>()

export const writingDomainValues = [
  "일상·실용문",
  "학업·논술문",
  "업무·비즈니스 문서",
  "창작·문학",
  "설득·의견문",
  "정보전달·설명문",
  "자기서사·기록",
  "관계·소통 문서",
  "공적·행정 문서",
  "디지털·뉴미디어",
] as const

export const writingDifficultyValues = ["입문", "기본", "심화"] as const
export const writingStatusValues = ["drafting", "complete"] as const

export const writingDomainSchema = z.enum(writingDomainValues)
export const writingDifficultySchema = z.enum(writingDifficultyValues)
export const writingStatusSchema = z.enum(writingStatusValues)

export const writingBriefSchema = z.strictObject({
  audience: z.string(),
  difficulty: writingDifficultySchema,
  domain: writingDomainSchema,
  goalChars: positiveIntegerSchema,
  minChars: positiveIntegerSchema,
  publicationId: writingTaskPublicationIdSchema,
  requiredElements: z.array(z.string().min(1)),
  situation: z.string(),
  taskId: writingTaskIdSchema,
  title: z.string(),
  typeName: z.string(),
})

export const writingCheckRevisionSchema = z.strictObject({
  example: z.string().min(1),
  location: z.string().min(1),
  reason: z.string().min(1),
})

export const writingCheckResultSchema = z.strictObject({
  revisions: z.array(writingCheckRevisionSchema).max(3),
  strengths: z.array(z.string().min(1)).min(1).max(2),
  unmetRequirements: z.array(z.string().min(1)),
})

export const writingParamsSchema = z.strictObject({
  writingId: writingIdSchema,
})

export const writingCatalogQuerySchema = z.strictObject({
  domain: writingDomainSchema.optional(),
  typeName: z.string().trim().min(1).max(100).optional(),
})

export const writingCatalogItemSchema = z.strictObject({
  audience: z.string(),
  difficulty: writingDifficultySchema,
  domain: writingDomainSchema,
  goalChars: positiveIntegerSchema,
  publicationId: writingTaskPublicationIdSchema,
  situation: z.string(),
  taskId: writingTaskIdSchema,
  title: z.string(),
  typeName: z.string(),
})

export const writingCatalogResponseSchema = z.strictObject({
  items: z.array(writingCatalogItemSchema),
})

export const writingSummarySchema = z.strictObject({
  charCount: nonNegativeIntegerSchema,
  createdAt: z.iso.datetime(),
  difficulty: writingDifficultySchema,
  domain: writingDomainSchema,
  id: writingIdSchema,
  status: writingStatusSchema,
  title: z.string(),
  typeName: z.string(),
  updatedAt: z.iso.datetime(),
  version: nonNegativeIntegerSchema,
})

export const writingDetailSchema = z.strictObject({
  aiNoticeAcknowledged: z.boolean(),
  body: z.string(),
  brief: writingBriefSchema,
  canComplete: z.boolean(),
  check: writingCheckResultSchema.nullable(),
  completedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  dailyChecksRemaining: nonNegativeIntegerSchema,
  id: writingIdSchema,
  status: writingStatusSchema,
  updatedAt: z.iso.datetime(),
  version: nonNegativeIntegerSchema,
})

export const writingListResponseSchema = z.strictObject({
  items: z.array(writingSummarySchema),
})

export const createWritingBodySchema = z.strictObject({
  taskId: writingTaskIdSchema,
})

export const saveWritingBodySchema = z.strictObject({
  body: z.string(),
  expectedVersion: nonNegativeIntegerSchema,
})

export const writingVersionBodySchema = z.strictObject({
  expectedVersion: nonNegativeIntegerSchema,
})

export const deleteWritingResponseSchema = z.strictObject({
  deleted: z.literal(true),
  id: writingIdSchema,
})

export const acknowledgeWritingAiNoticeResponseSchema = z.strictObject({
  acknowledged: z.literal(true),
})

export type WritingDomain = z.infer<typeof writingDomainSchema>
export type WritingDifficulty = z.infer<typeof writingDifficultySchema>
export type WritingStatus = z.infer<typeof writingStatusSchema>
export type WritingBriefDto = z.infer<typeof writingBriefSchema>
export type WritingCheckResultDto = z.infer<typeof writingCheckResultSchema>
export type WritingSummaryDto = z.infer<typeof writingSummarySchema>
export type WritingDetailDto = z.infer<typeof writingDetailSchema>
export type WritingCatalogItemDto = z.infer<typeof writingCatalogItemSchema>
