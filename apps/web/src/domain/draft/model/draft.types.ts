import type {
  DraftContent,
  JsonValue,
  TiptapMark as DraftMark,
  TiptapNode as DraftNode,
} from "@workspace/core"

export type { DraftContent, DraftMark, DraftNode, JsonValue }

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
  savedPrompts: import("@/domain/prompt").PromptSummary[]
  todayPrompts: import("@/domain/prompt").PromptSummary[]
}
