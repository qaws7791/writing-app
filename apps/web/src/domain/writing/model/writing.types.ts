export type WritingMarkType = "bold" | "italic"

export type WritingMark = {
  type: WritingMarkType
}

export type WritingNodeType =
  | "blockquote"
  | "bulletList"
  | "heading"
  | "listItem"
  | "orderedList"
  | "paragraph"
  | "text"

export type WritingNode = {
  attrs?: { level?: number; start?: number }
  content?: WritingNode[]
  marks?: WritingMark[]
  text?: string
  type: WritingNodeType
}

export type WritingContent = {
  content?: WritingNode[]
  type: "doc"
}

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
