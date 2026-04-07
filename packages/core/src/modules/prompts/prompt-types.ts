import type { PromptId } from "../../shared/brand/index"

export type PromptType = "sensory" | "reflection" | "opinion"

export type PromptSummary = {
  readonly id: PromptId
  readonly promptType: PromptType
  readonly title: string
  readonly body: string
  readonly responseCount: number
  readonly isBookmarked: boolean
}

export type PromptListFilters = {
  promptType?: PromptType
}

export type PromptBookmarkResult =
  | { kind: "bookmarked"; savedAt: string }
  | { kind: "not-found" }
