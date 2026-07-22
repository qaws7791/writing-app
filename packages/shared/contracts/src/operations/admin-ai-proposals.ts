import { z } from "zod"
import { courseIdSchema } from "#contracts/content/ids"
import {
  adminIdSchema,
  conversationIdSchema,
} from "#contracts/identity/admin-ids"
import { adminResourceDocumentIdSchema } from "#contracts/resource-library/shared"
import type { AiChangeProposalId } from "@workspace/types/ids"

const proposalIdentifierSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .transform((value): AiChangeProposalId => value as AiChangeProposalId)

export const aiChangeProposalIdSchema = proposalIdentifierSchema

export const adminAiChangeSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    courseId: courseIdSchema,
    description: z.string().max(10_000).optional(),
    expectedEditVersion: z.number().int().nonnegative(),
    kind: z.literal("content-course-draft"),
    title: z.string().trim().min(1).max(200).optional(),
  }),
  z.strictObject({
    contentMarkdown: z.string().max(100_000).optional(),
    documentId: adminResourceDocumentIdSchema,
    expectedVersion: z.number().int().nonnegative(),
    kind: z.literal("resource-document"),
    name: z.string().trim().min(1).max(200).optional(),
  }),
])

export const adminAiChangeProposalStatusSchema = z.enum([
  "proposed",
  "applying",
  "approved",
  "rejected",
])

export const adminAiChangeProposalDtoSchema = z.strictObject({
  change: adminAiChangeSchema,
  conversationId: conversationIdSchema,
  createdAt: z.string(),
  createdByAdminId: adminIdSchema,
  id: aiChangeProposalIdSchema,
  reviewedAt: z.string().nullable(),
  reviewedByAdminId: adminIdSchema.nullable(),
  status: adminAiChangeProposalStatusSchema,
})

export type AdminAiChange = z.infer<typeof adminAiChangeSchema>
export type AdminAiChangeProposalDto = z.infer<
  typeof adminAiChangeProposalDtoSchema
>
export type AdminAiChangeProposalStatus = z.infer<
  typeof adminAiChangeProposalStatusSchema
>
export type { AiChangeProposalId } from "@workspace/types/ids"
