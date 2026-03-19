export type PromptLevel = 1 | 2 | 3

export type PromptLengthLabel = "깊이" | "보통" | "짧음"

export type PromptTopic =
  | "감정"
  | "경험"
  | "관계"
  | "기술"
  | "기억"
  | "문화"
  | "사회"
  | "상상"
  | "성장"
  | "여행"
  | "일상"
  | "자기이해"
  | "진로"

export type JsonValue =
  | JsonValue[]
  | { [key: string]: JsonValue }
  | boolean
  | null
  | number
  | string

export type DraftMark = {
  attrs?: { [key: string]: JsonValue }
  type: string
}

export type DraftNode = {
  attrs?: { [key: string]: JsonValue }
  content?: DraftNode[]
  marks?: DraftMark[]
  text?: string
  type: string
}

export type DraftContent = {
  content?: DraftNode[]
  type: "doc"
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
