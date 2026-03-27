import {
  getAISuggestions,
  getDocumentReview,
  getFlowReview,
} from "@workspace/ai"
import type {
  AIFeatureType,
  AIReviewParagraph,
  AISuggestion,
  ReviewItem,
  UserId,
} from "@workspace/core"
import type { AIRequestRepository } from "@workspace/database"

export type AIApiService = {
  getSuggestions: (
    userId: UserId,
    text: string,
    type: AIFeatureType
  ) => Promise<AISuggestion[]>
  getDocumentReview: (
    userId: UserId,
    paragraphs: AIReviewParagraph[]
  ) => Promise<ReviewItem[]>
  getFlowReview: (
    userId: UserId,
    paragraphs: AIReviewParagraph[]
  ) => Promise<ReviewItem[]>
}

type AIApiServiceDeps = {
  aiRequestRepository: AIRequestRepository
}

export function createAIApiService(deps: AIApiServiceDeps): AIApiService {
  const { aiRequestRepository } = deps

  return {
    async getSuggestions(userId, text, type) {
      const suggestions = await getAISuggestions(text, type)

      aiRequestRepository.saveRequest({
        userId: userId as string,
        featureType: type,
        inputText: text,
        outputJson: JSON.stringify(suggestions),
        model: "gemini-3.1-flash-lite-preview",
      })

      return suggestions
    },

    async getDocumentReview(userId, paragraphs) {
      const inputText = paragraphs.map((p) => p.text).join("\n")
      const items = await getDocumentReview(paragraphs)

      aiRequestRepository.saveRequest({
        userId: userId as string,
        featureType: "document-review",
        inputText,
        outputJson: JSON.stringify(items),
        model: "gemini-3.1-flash-lite-preview",
      })

      return items
    },

    async getFlowReview(userId, paragraphs) {
      const inputText = paragraphs.map((p) => p.text).join("\n")
      const items = await getFlowReview(paragraphs)

      aiRequestRepository.saveRequest({
        userId: userId as string,
        featureType: "flow-review",
        inputText,
        outputJson: JSON.stringify(items),
        model: "gemini-3.1-flash-lite-preview",
      })

      return items
    },
  }
}
