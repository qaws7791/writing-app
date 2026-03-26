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

export type PromptLevel = 1 | 2 | 3

export type PromptLengthLabel = "깊이" | "보통" | "짧음"

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
