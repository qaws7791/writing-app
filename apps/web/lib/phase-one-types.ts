import type {
  DraftContent,
  JsonValue,
  PromptLengthLabel,
  PromptLevel,
  PromptTopic,
  TiptapMark as DraftMark,
  TiptapNode as DraftNode,
} from "@workspace/backend-core"

export type {
  DraftContent,
  DraftMark,
  DraftNode,
  JsonValue,
  PromptLengthLabel,
  PromptLevel,
  PromptTopic,
}

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

export type DraftSummary = {
  characterCount: number
  id: number
  lastSavedAt: string
  preview: string
  sourcePromptId: number | null
  title: string
  wordCount: number
}

export type DraftDetail = DraftSummary & {
  content: DraftContent
  createdAt: string
  updatedAt: string
}

export type HomeSnapshot = {
  recentDrafts: DraftSummary[]
  resumeDraft: DraftSummary | null
  savedPrompts: PromptSummary[]
  todayPrompts: PromptSummary[]
}

export type PromptFilters = {
  level?: PromptLevel
  query?: string
  saved?: boolean
  topic?: PromptTopic
}
