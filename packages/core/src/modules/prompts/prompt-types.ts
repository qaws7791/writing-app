import type { PromptId } from "../../shared/brand/index"

export type PromptType = "sensory" | "reflection" | "opinion"

export type PromptSummary = {
  readonly id: PromptId
  readonly promptType: PromptType
  readonly title: string
  readonly body: string
  readonly thumbnailUrl: string
  readonly responseCount: number
  readonly isBookmarked: boolean
}

export type PromptListFilters = {
  promptType?: PromptType
  cursor?: number
  limit?: number
}

export type PromptListPage = {
  readonly items: readonly PromptSummary[]
  readonly nextCursor: number | null
}

export type PromptCategory = {
  readonly key: PromptType
  readonly label: string
}

export const PROMPT_CATEGORIES: readonly PromptCategory[] = [
  { key: "sensory", label: "감각" },
  { key: "reflection", label: "회고" },
  { key: "opinion", label: "의견" },
] as const

export type PromptBookmarkResult =
  | { kind: "bookmarked"; savedAt: string }
  | { kind: "not-found" }
