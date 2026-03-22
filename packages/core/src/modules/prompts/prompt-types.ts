import type { PromptId } from "../../shared/brand/index"
import type {
  PromptLengthLabel,
  PromptLevel,
  PromptTopic,
} from "../../shared/schema/index"

export type PromptSaveResult =
  | { kind: "saved"; savedAt: string }
  | { kind: "not-found" }

export type PromptListFilters = {
  level?: PromptLevel
  query?: string
  saved?: boolean
  topic?: PromptTopic
}

export type PromptSummary = {
  readonly id: PromptId
  readonly level: PromptLevel
  readonly saved: boolean
  readonly suggestedLengthLabel: PromptLengthLabel
  readonly tags: readonly string[]
  readonly text: string
  readonly topic: PromptTopic
}

export type PromptDetail = PromptSummary & {
  readonly description: string
  readonly outline: readonly string[]
  readonly tips: readonly string[]
}
