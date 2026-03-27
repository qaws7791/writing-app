import type {
  AIReviewParagraph,
  AISuggestion,
  AISuggestionInput,
  ReviewItem,
} from "@workspace/core"

export interface AIService {
  getSuggestions(input: AISuggestionInput): Promise<AISuggestion[]>
  getDocumentReview(paragraphs: AIReviewParagraph[]): Promise<ReviewItem[]>
  getFlowReview(paragraphs: AIReviewParagraph[]): Promise<ReviewItem[]>
}
