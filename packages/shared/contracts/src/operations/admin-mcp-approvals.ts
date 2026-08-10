import type { AdminMcpApprovalId } from "@workspace/types/ids"
import { z } from "zod"

import { courseIdSchema } from "#contracts/content/ids"
import { contentStatusSchema } from "#contracts/content/status"
import { createIdentifierSchema } from "#contracts/identifier"
import { userIdSchema } from "#contracts/identity/admin-ids"
import { learnerOperationalStatusSchema } from "#contracts/identity/status"
import { nonNegativeIntegerSchema } from "#contracts/shared/integer"

export type { AdminMcpApprovalId } from "@workspace/types/ids"

export const adminMcpApprovalIdSchema =
  createIdentifierSchema<AdminMcpApprovalId>()

export const adminMcpChangeToolNameSchema = z.enum([
  "admin_create_course_draft",
  "admin_archive_course",
  "admin_restore_course",
  "admin_publish_course",
  "admin_set_user_status",
  "admin_delete_user",
])

export const adminMcpApprovalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "expired",
  "executing",
  "succeeded",
  "failed",
])

export const adminMcpApprovalTargetSchema = z.discriminatedUnion("kind", [
  z
    .object({
      courseId: courseIdSchema,
      editVersion: nonNegativeIntegerSchema,
      kind: z.literal("course-create"),
      title: z.string().min(1).max(200),
    })
    .strict(),
  z
    .object({
      courseId: courseIdSchema,
      editVersion: nonNegativeIntegerSchema,
      expectedStatus: contentStatusSchema,
      kind: z.literal("course-lifecycle"),
      title: z.string().min(1).max(200),
    })
    .strict(),
  z
    .object({
      courseId: courseIdSchema,
      editVersion: nonNegativeIntegerSchema,
      kind: z.literal("course-publish"),
      title: z.string().min(1).max(200),
    })
    .strict(),
  z
    .object({
      expectedStatus: learnerOperationalStatusSchema,
      kind: z.literal("user-status"),
      targetStatus: learnerOperationalStatusSchema,
      userId: userIdSchema,
    })
    .strict(),
  z
    .object({
      expectedStatus: learnerOperationalStatusSchema,
      kind: z.literal("user-delete"),
      userId: userIdSchema,
    })
    .strict(),
])

export const adminMcpApprovalDtoSchema = z
  .object({
    completedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    decidedAt: z.iso.datetime().nullable(),
    expiresAt: z.iso.datetime(),
    id: adminMcpApprovalIdSchema,
    mcpCredentialId: z.string().min(1).max(200),
    requestId: z.string().min(1).max(200),
    status: adminMcpApprovalStatusSchema,
    target: adminMcpApprovalTargetSchema,
    toolName: adminMcpChangeToolNameSchema,
  })
  .strict()

export const adminMcpApprovalDecisionSchema = z
  .object({
    decision: z.enum(["approve", "reject"]),
  })
  .strict()

export const adminMcpApprovalParamsSchema = z
  .object({ approvalId: adminMcpApprovalIdSchema })
  .strict()

export type AdminMcpApprovalDecision = z.infer<
  typeof adminMcpApprovalDecisionSchema
>
export type AdminMcpApprovalDto = z.infer<typeof adminMcpApprovalDtoSchema>
export type AdminMcpApprovalStatus = z.infer<
  typeof adminMcpApprovalStatusSchema
>
export type AdminMcpApprovalTarget = z.infer<
  typeof adminMcpApprovalTargetSchema
>
export type AdminMcpChangeToolName = z.infer<
  typeof adminMcpChangeToolNameSchema
>
