import type {
  WritingContent,
  JsonValue,
  TiptapMark as WritingMark,
  TiptapNode as WritingNode,
} from "@workspace/core"

export type { WritingContent, WritingMark, WritingNode, JsonValue }

export type WritingSummary = {
  characterCount: number
  id: number
  lastSavedAt: string
  preview: string
  sourcePromptId: number | null
  title: string
  wordCount: number
}

export type WritingDetail = WritingSummary & {
  content: WritingContent
  createdAt: string
  updatedAt: string
}

export type HomeSnapshot = {
  recentWritings: WritingSummary[]
  resumeWriting: WritingSummary | null
  savedPrompts: import("@/domain/prompt").PromptSummary[]
  todayPrompts: import("@/domain/prompt").PromptSummary[]
}
