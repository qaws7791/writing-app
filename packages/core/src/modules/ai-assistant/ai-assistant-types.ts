export type AIFeatureType = "vocabulary" | "clarity" | "rhythm"

export type AISuggestion = {
  readonly id: string
  readonly original: string
  readonly suggestion: string
  readonly reason: string
}

export type ReviewItemType = "spelling" | "duplicate" | "flow"

export type ReviewItem = {
  readonly id: string
  readonly type: ReviewItemType
  readonly from: number
  readonly to: number
  readonly original: string
  readonly suggestion: string
  readonly reason: string
}

export type AISuggestionInput = {
  readonly text: string
  readonly type: AIFeatureType
}

export type AIReviewParagraph = {
  readonly from: number
  readonly to: number
  readonly text: string
}

export type AIDocumentReviewInput = {
  readonly paragraphs: AIReviewParagraph[]
}

export type AIFlowReviewInput = {
  readonly paragraphs: AIReviewParagraph[]
}
