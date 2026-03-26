export type JsonPrimitive = boolean | null | number | string
export type JsonArray = JsonValue[]
export type JsonObject = { [key: string]: JsonValue }
export type JsonValue = JsonArray | JsonObject | JsonPrimitive

export type WritingMark = {
  attrs?: { [key: string]: unknown }
  type: string
}

export type WritingNode = {
  attrs?: { [key: string]: unknown }
  content?: WritingNode[]
  marks?: WritingMark[]
  text?: string
  type: string
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
