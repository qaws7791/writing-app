import { and, eq } from "drizzle-orm"
import { adminAiChangeSchema } from "@workspace/contracts/operations/admin-ai-proposals"
import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  AdminId,
  AiChangeProposalId,
  ConversationId,
} from "@workspace/types/ids"

import type { AiChangeProposalRepository } from "#operations/application/ports/operations-ports"
import type { AiChangeProposal } from "#operations/domain/ai-change-proposal"
import { operationsAiChangeProposals } from "#operations/infrastructure/persistence/schema"

export function createAiChangeProposalRepository(
  database: WritingAppDatabase
): AiChangeProposalRepository {
  return Object.freeze({
    async createProposal(proposal) {
      database.insert(operationsAiChangeProposals).values(toRow(proposal)).run()
    },
    async readProposal(proposalId) {
      const row = database
        .select()
        .from(operationsAiChangeProposals)
        .where(eq(operationsAiChangeProposals.id, proposalId))
        .get()
      return row === undefined ? null : toProposal(row)
    },
    async transitionProposal(input) {
      const result = database
        .update(operationsAiChangeProposals)
        .set(toRow(input.proposal))
        .where(
          and(
            eq(operationsAiChangeProposals.id, input.proposal.id),
            eq(operationsAiChangeProposals.status, input.expectedStatus)
          )
        )
        .returning({ id: operationsAiChangeProposals.id })
        .get()
      return result === undefined ? "conflict" : "updated"
    },
  })
}

function toRow(proposal: AiChangeProposal) {
  return {
    changeJson: JSON.stringify(proposal.change),
    conversationId: proposal.conversationId,
    createdAt: proposal.createdAt,
    createdByAdminId: proposal.createdByAdminId,
    id: proposal.id,
    reviewedAt: proposal.reviewedAt,
    reviewedByAdminId: proposal.reviewedByAdminId,
    status: proposal.status,
  }
}

function toProposal(
  row: typeof operationsAiChangeProposals.$inferSelect
): AiChangeProposal {
  return Object.freeze({
    change: adminAiChangeSchema.parse(JSON.parse(row.changeJson)),
    conversationId: row.conversationId as ConversationId,
    createdAt: row.createdAt,
    createdByAdminId: row.createdByAdminId as AdminId,
    id: row.id as AiChangeProposalId,
    reviewedAt: row.reviewedAt,
    reviewedByAdminId:
      row.reviewedByAdminId === null
        ? null
        : (row.reviewedByAdminId as AdminId),
    status: row.status,
  })
}
