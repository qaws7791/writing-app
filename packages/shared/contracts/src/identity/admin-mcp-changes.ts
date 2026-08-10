import { z } from "zod"

import { userIdSchema } from "#contracts/identity/admin-ids"
import { learnerOperationalStatusSchema } from "#contracts/identity/status"
import { adminMcpApprovalIdSchema } from "#contracts/operations/admin-mcp-approvals"
import {
  adminMcpExecutionIdSchema,
  adminMcpIdempotencyKeySchema,
} from "#contracts/operations/admin-mcp-executions"

export const adminMcpSetUserStatusInputSchema = z
  .object({
    idempotencyKey: adminMcpIdempotencyKeySchema,
    status: learnerOperationalStatusSchema,
    userId: userIdSchema,
  })
  .strict()

export const adminMcpDeleteUserInputSchema = z
  .object({
    idempotencyKey: adminMcpIdempotencyKeySchema,
    userId: userIdSchema,
  })
  .strict()

export const adminMcpSetUserStatusResultSchema = z
  .object({
    approvalId: adminMcpApprovalIdSchema,
    executionId: adminMcpExecutionIdSchema,
    replayed: z.boolean(),
    status: learnerOperationalStatusSchema,
    userId: userIdSchema,
  })
  .strict()

export const adminMcpDeleteUserResultSchema = z
  .object({
    approvalId: adminMcpApprovalIdSchema,
    deleted: z.literal(true),
    executionId: adminMcpExecutionIdSchema,
    replayed: z.boolean(),
    userId: userIdSchema,
  })
  .strict()

export type AdminMcpDeleteUserInput = z.infer<
  typeof adminMcpDeleteUserInputSchema
>
export type AdminMcpDeleteUserResult = z.infer<
  typeof adminMcpDeleteUserResultSchema
>
export type AdminMcpSetUserStatusInput = z.infer<
  typeof adminMcpSetUserStatusInputSchema
>
export type AdminMcpSetUserStatusResult = z.infer<
  typeof adminMcpSetUserStatusResultSchema
>
