import type {
  AdminId,
  AiChangeProposalId,
  ConversationId,
  CourseId,
  ResourceDocumentId,
} from "@workspace/types/ids"
import type { OperationsError } from "#operations/domain/operations-error"

export type AiChange =
  | Readonly<{
      courseId: CourseId
      description?: string
      expectedEditVersion: number
      kind: "content-course-draft"
      title?: string
    }>
  | Readonly<{
      contentMarkdown?: string
      documentId: ResourceDocumentId
      expectedVersion: number
      kind: "resource-document"
      name?: string
    }>

export type AiChangeProposalStatus =
  | "proposed"
  | "applying"
  | "approved"
  | "rejected"

export type AiChangeProposal = Readonly<{
  change: AiChange
  conversationId: ConversationId
  createdAt: Date
  createdByAdminId: AdminId
  id: AiChangeProposalId
  reviewedAt: Date | null
  reviewedByAdminId: AdminId | null
  status: AiChangeProposalStatus
}>

export type AiCommand =
  | "change-operations-settings"
  | "change-permissions"
  | "permanently-delete-resource"
  | "propose-content-draft"
  | "propose-resource-document"
  | "publish-content"

export function authorizeAiCommand(
  command: AiCommand
): "allowed" | "forbidden" {
  return command === "propose-content-draft" ||
    command === "propose-resource-document"
    ? "allowed"
    : "forbidden"
}

export function decideProposalReview(input: {
  readonly decision: "approve" | "reject"
  readonly proposal: AiChangeProposal
  readonly reviewerId: AdminId
  readonly reviewedAt: Date
}): AiChangeProposal | OperationsError {
  if (input.proposal.status !== "proposed") {
    return { kind: "conflict", reason: "proposal-already-reviewed" }
  }

  return Object.freeze({
    ...input.proposal,
    reviewedAt: input.reviewedAt,
    reviewedByAdminId: input.reviewerId,
    status: input.decision === "approve" ? "applying" : "rejected",
  })
}

export function decideProposalApplied(
  proposal: AiChangeProposal
): AiChangeProposal | OperationsError {
  return proposal.status === "applying"
    ? Object.freeze({ ...proposal, status: "approved" })
    : { kind: "conflict", reason: "proposal-not-applying" }
}
