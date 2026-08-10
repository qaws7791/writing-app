import type { AdminMcpChangeToolName } from "@workspace/contracts/operations/admin-mcp-approvals"
import type { Result } from "@workspace/kernel/result"
import type { AdminId, AdminMcpApprovalId } from "@workspace/types/ids"

import type {
  AdminMcpApproval,
  AdminMcpApprovalError,
} from "#operations/domain/admin-mcp-approval"

export type AdminMcpApprovalRepository = Readonly<{
  claim: (input: {
    readonly approvalId: AdminMcpApprovalId
    readonly executionLeaseCutoff: Date
    readonly inputDigest: string
    readonly now: Date
    readonly oauthClientId: string
    readonly ownerAdminId: AdminId
    readonly toolName: AdminMcpChangeToolName
  }) => Promise<
    Result<
      Readonly<{
        approval: AdminMcpApproval
        outcome: "acquired" | "awaiting-approval" | "completed" | "in-progress"
      }>,
      AdminMcpApprovalError
    >
  >
  complete: (input: {
    readonly approvalId: AdminMcpApprovalId
    readonly failureCode: string | null
    readonly now: Date
    readonly outcome: "failed" | "succeeded"
  }) => Promise<Result<AdminMcpApproval, AdminMcpApprovalError>>
  createOrRead: (approval: AdminMcpApproval) => Promise<
    Result<
      Readonly<{
        approval: AdminMcpApproval
        created: boolean
      }>,
      AdminMcpApprovalError
    >
  >
  decide: (input: {
    readonly approvalId: AdminMcpApprovalId
    readonly decision: "approve" | "reject"
    readonly now: Date
    readonly ownerAdminId: AdminId
  }) => Promise<Result<AdminMcpApproval, AdminMcpApprovalError>>
  readForOwner: (input: {
    readonly approvalId: AdminMcpApprovalId
    readonly now: Date
    readonly ownerAdminId: AdminId
  }) => Promise<Result<AdminMcpApproval, AdminMcpApprovalError>>
}>
