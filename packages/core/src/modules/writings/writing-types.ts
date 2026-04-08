import type { WritingId, PromptId } from "../../shared/brand/index"

export type WritingSummary = {
  readonly id: WritingId
  readonly title: string
  readonly preview: string
  readonly wordCount: number
  readonly sourcePromptId: PromptId | null
  readonly createdAt: string
  readonly updatedAt: string
}

export type WritingDetail = WritingSummary & {
  readonly bodyJson: unknown
  readonly bodyPlainText: string
}

export type WritingCreateInput = {
  readonly title: string
  readonly bodyJson: unknown
  readonly bodyPlainText: string
  readonly wordCount: number
  readonly sourcePromptId?: PromptId | null
  readonly sourceSessionId?: number | null
}

export type WritingUpdateInput = {
  readonly title?: string
  readonly bodyJson?: unknown
  readonly bodyPlainText?: string
  readonly wordCount?: number
}

export type WritingAccessResult =
  | { kind: "writing"; writing: WritingDetail }
  | { kind: "not-found" }
  | { kind: "forbidden" }

export type WritingUpdateResult =
  | { kind: "updated"; writing: WritingDetail }
  | { kind: "not-found" }
  | { kind: "forbidden" }

export type WritingDeleteResult =
  | { kind: "deleted" }
  | { kind: "not-found" }
  | { kind: "forbidden" }

export type PublicWritingSummary = {
  readonly id: WritingId
  readonly title: string
  readonly preview: string
  readonly wordCount: number
  readonly createdAt: string
  readonly isOwner: boolean
}

export type ListPromptWritingsParams = {
  cursor?: string
  limit?: number
}
