import { err, ok, type Result } from "@workspace/kernel/result"
import type {
  AdminId,
  AiChangeProposalId,
  ConversationId,
} from "@workspace/types/ids"

import {
  authorizeAiCommand,
  decideProposalApplied,
  decideProposalReview,
  type AiChange,
  type AiChangeProposal,
} from "#operations/domain/ai-change-proposal"
import type { OperationsActor } from "#operations/domain/operations-actor"
import type { OperationsError } from "#operations/domain/operations-error"
import type {
  AiChangeProposalRepository,
  AiChangeTargetPort,
  OperationsClock,
  OperationsProposalIdGenerator,
} from "#operations/application/ports/operations-ports"

export type AiChangeProposalApplication = Readonly<{
  createProposal: (
    input: Readonly<{
      adminId: AdminId
      change: AiChange
      conversationId: ConversationId
    }>
  ) => Promise<Result<AiChangeProposal, OperationsError>>
  readProposal: (
    proposalId: AiChangeProposalId
  ) => Promise<Result<AiChangeProposal, OperationsError>>
  reviewProposal: (
    input: Readonly<{
      actor: OperationsActor
      decision: "approve" | "reject"
      proposalId: AiChangeProposalId
    }>
  ) => Promise<Result<AiChangeProposal, OperationsError>>
}>

export function createAiChangeProposalApplication(input: {
  readonly clock: OperationsClock
  readonly idGenerator: OperationsProposalIdGenerator
  readonly repository: AiChangeProposalRepository
  readonly target: AiChangeTargetPort
}): AiChangeProposalApplication {
  const readProposal = async (
    proposalId: AiChangeProposalId
  ): Promise<Result<AiChangeProposal, OperationsError>> => {
    try {
      const proposal = await input.repository.readProposal(proposalId)
      return proposal === null
        ? err({ kind: "not-found", target: "ai-change-proposal" })
        : ok(proposal)
    } catch {
      return err({
        kind: "persistence-failed",
        operation: "read-ai-change-proposal",
      })
    }
  }

  return Object.freeze({
    async createProposal(command) {
      const policy =
        command.change.kind === "content-course-draft"
          ? authorizeAiCommand("propose-content-draft")
          : authorizeAiCommand("propose-resource-document")
      if (policy === "forbidden") return err({ kind: "permission-denied" })
      const proposal: AiChangeProposal = Object.freeze({
        change: command.change,
        conversationId: command.conversationId,
        createdAt: input.clock.now(),
        createdByAdminId: command.adminId,
        id: input.idGenerator.next(),
        reviewedAt: null,
        reviewedByAdminId: null,
        status: "proposed",
      })
      try {
        await input.repository.createProposal(proposal)
        return ok(proposal)
      } catch {
        return err({
          kind: "persistence-failed",
          operation: "create-ai-change-proposal",
        })
      }
    },
    readProposal,
    async reviewProposal(command) {
      const currentResult = await readProposal(command.proposalId)
      if (currentResult.isErr()) return err(currentResult.error)
      const reviewed = decideProposalReview({
        decision: command.decision,
        proposal: currentResult.value,
        reviewedAt: input.clock.now(),
        reviewerId: command.actor.id,
      })
      if ("kind" in reviewed) return err(reviewed)
      const transitioned = await transition(input.repository, {
        expectedStatus: "proposed",
        proposal: reviewed,
      })
      if (transitioned.isErr()) return err(transitioned.error)
      if (reviewed.status === "rejected") return ok(reviewed)

      const targetResult =
        reviewed.change.kind === "content-course-draft"
          ? await input.target.applyContentDraft(command.actor, reviewed.change)
          : await input.target.applyResourceDocument(
              command.actor,
              reviewed.change
            )
      if (targetResult.kind !== "ok") {
        const restored = await transition(input.repository, {
          expectedStatus: "applying",
          proposal: { ...currentResult.value, status: "proposed" },
        })
        if (restored.isErr()) return err(restored.error)
        return err(targetResult)
      }

      const applied = decideProposalApplied(reviewed)
      if ("kind" in applied) return err(applied)
      return (
        await transition(input.repository, {
          expectedStatus: "applying",
          proposal: applied,
        })
      ).map(() => applied)
    },
  })
}

async function transition(
  repository: AiChangeProposalRepository,
  input: Parameters<AiChangeProposalRepository["transitionProposal"]>[0]
): Promise<Result<void, OperationsError>> {
  try {
    return (await repository.transitionProposal(input)) === "updated"
      ? ok(undefined)
      : err({ kind: "conflict", reason: "proposal-state-changed" })
  } catch {
    return err({
      kind: "persistence-failed",
      operation: "transition-ai-change-proposal",
    })
  }
}
