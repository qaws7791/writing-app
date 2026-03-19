import type { DraftContent } from "./content.js"
import type { DraftId, PromptId, UserId } from "./brand.js"

export type PromptLevel = 1 | 2 | 3

export type PromptLengthLabel = "깊이" | "보통" | "짧음"

export const promptTopics = [
  "감정",
  "경험",
  "관계",
  "기술",
  "기억",
  "문화",
  "사회",
  "상상",
  "성장",
  "여행",
  "일상",
  "자기이해",
  "진로",
] as const

export type PromptTopic = (typeof promptTopics)[number]

export type PromptSummary = {
  id: PromptId
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

export type PromptListFilters = {
  level?: PromptLevel
  query?: string
  saved?: boolean
  topic?: PromptTopic
}

export type PromptSaveResult =
  | {
      kind: "saved"
      savedAt: string
    }
  | {
      kind: "not-found"
    }

export type DraftSummary = {
  characterCount: number
  id: DraftId
  lastSavedAt: string
  preview: string
  sourcePromptId: PromptId | null
  title: string
  wordCount: number
}

export type DraftDetail = DraftSummary & {
  content: DraftContent
  createdAt: string
  updatedAt: string
}

export type DraftAccessResult =
  | {
      draft: DraftDetail
      kind: "draft"
    }
  | {
      kind: "forbidden"
      ownerId: UserId
    }
  | {
      kind: "not-found"
    }

export type DraftMutationResult =
  | {
      draft: DraftDetail
      kind: "draft"
    }
  | {
      kind: "forbidden"
      ownerId: UserId
    }
  | {
      kind: "not-found"
    }

export type DraftDeleteResult =
  | {
      kind: "deleted"
    }
  | {
      kind: "forbidden"
      ownerId: UserId
    }
  | {
      kind: "not-found"
    }

export type DraftCreateInput = {
  content: DraftContent
  sourcePromptId: PromptId | null
  title: string
}

export type DraftPersistInput = DraftCreateInput & {
  characterCount: number
  plainText: string
  wordCount: number
}

export type DraftAutosaveResult = {
  draft: DraftDetail
  kind: "autosaved"
}

export type HomeSnapshot = {
  recentDrafts: DraftSummary[]
  resumeDraft: DraftSummary | null
  savedPrompts: PromptSummary[]
  todayPrompts: PromptSummary[]
}
