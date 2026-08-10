import type { AdminMcpApprovalDecision } from "@workspace/contracts/operations/admin-mcp-approvals"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import { err, type Result } from "@workspace/kernel/result"
import type { AdminId, AdminMcpApprovalId } from "@workspace/types/ids"

import type { AdminMcpApprovalRepository } from "#operations/application/ports/admin-mcp-approval-repository"
import {
  createAdminMcpApproval,
  hasAdminMcpApprovalBinding,
  isValidAdminMcpFailureCode,
  type AdminMcpApproval,
  type AdminMcpApprovalError,
  type CreateAdminMcpApprovalInput,
} from "#operations/domain/admin-mcp-approval"

export type AdminMcpApprovals = Readonly<{
  claim: (input: {
    readonly approvalId: AdminMcpApprovalId
    readonly executionLeaseMs: number
    readonly inputDigest: string
    readonly oauthClientId: string
    readonly ownerAdminId: AdminId
    readonly toolName: AdminMcpApproval["toolName"]
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
    readonly outcome: "failed" | "succeeded"
  }) => Promise<Result<AdminMcpApproval, AdminMcpApprovalError>>
  decide: (input: {
    readonly approvalId: AdminMcpApprovalId
    readonly decision: AdminMcpApprovalDecision["decision"]
    readonly ownerAdminId: AdminId
  }) => Promise<Result<AdminMcpApproval, AdminMcpApprovalError>>
  readForOwner: (input: {
    readonly approvalId: AdminMcpApprovalId
    readonly ownerAdminId: AdminId
  }) => Promise<Result<AdminMcpApproval, AdminMcpApprovalError>>
  request: (
    input: Omit<CreateAdminMcpApprovalInput, "createdAt" | "id">
  ) => Promise<
    Result<
      Readonly<{ approval: AdminMcpApproval; created: boolean }>,
      AdminMcpApprovalError
    >
  >
}>

export function createAdminMcpApprovals(input: {
  readonly clock: Clock
  readonly idGenerator: IdGenerator<string>
  readonly repository: AdminMcpApprovalRepository
}): AdminMcpApprovals {
  return {
    async claim(command) {
      if (
        !Number.isInteger(command.executionLeaseMs) ||
        command.executionLeaseMs < 1_000 ||
        command.executionLeaseMs > 10 * 60 * 1_000
      ) {
        return err({ kind: "admin-mcp-approval-invalid" })
      }

      const now = input.clock.now()
      const claimed = await input.repository.claim({
        approvalId: command.approvalId,
        executionLeaseCutoff: new Date(
          now.getTime() - command.executionLeaseMs
        ),
        inputDigest: command.inputDigest,
        now,
        oauthClientId: command.oauthClientId,
        ownerAdminId: command.ownerAdminId,
        toolName: command.toolName,
      })
      if (claimed.isErr()) return claimed
      if (!hasAdminMcpApprovalBinding(claimed.value.approval, command)) {
        return err({ kind: "admin-mcp-approval-binding-mismatch" })
      }
      return claimed
    },
    async complete(command) {
      if (
        command.failureCode !== null &&
        !isValidAdminMcpFailureCode(command.failureCode)
      ) {
        return err({ kind: "admin-mcp-approval-invalid" })
      }
      if (
        (command.outcome === "succeeded" && command.failureCode !== null) ||
        (command.outcome === "failed" && command.failureCode === null)
      ) {
        return err({ kind: "admin-mcp-approval-invalid" })
      }

      return input.repository.complete({
        ...command,
        now: input.clock.now(),
      })
    },
    decide(command) {
      return input.repository.decide({ ...command, now: input.clock.now() })
    },
    readForOwner(command) {
      return input.repository.readForOwner({
        ...command,
        now: input.clock.now(),
      })
    },
    async request(command) {
      const approval = createAdminMcpApproval({
        ...command,
        createdAt: input.clock.now(),
        id: `admin-mcp-approval-${input.idGenerator.next()}`,
      })
      return approval.isErr()
        ? err(approval.error)
        : input.repository.createOrRead(approval.value)
    },
  }
}
