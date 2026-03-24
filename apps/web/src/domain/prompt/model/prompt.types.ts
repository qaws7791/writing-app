import type {
  PromptLengthLabel,
  PromptLevel,
  PromptTopic,
} from "@workspace/core"

export type { PromptLengthLabel, PromptLevel, PromptTopic }

export type PromptSummary = {
  id: number
  saved: boolean
  suggestedLengthLabel: PromptLengthLabel
  tags: string[]
  text: string
  topic: PromptTopic
  level: PromptLevel
}

export type PromptDetail = PromptSummary & {
  description: string
  outline: string[]
  tips: string[]
}

export type PromptFilters = {
  level?: PromptLevel
  query?: string
  saved?: boolean
  topic?: PromptTopic
}
