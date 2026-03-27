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
import type { ApiLogger } from "./observability/logger"

const AI_MODEL = "gemini-3.1-flash-lite-preview" as const

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
  logger: ApiLogger
}

export function createAIApiService(deps: AIApiServiceDeps): AIApiService {
  const { aiRequestRepository, logger } = deps

  return {
    async getSuggestions(userId, text, type) {
      const suggestions = await getAISuggestions(text, type)

      try {
        await aiRequestRepository.saveRequest({
          userId: userId as string,
          featureType: type,
          inputText: text,
          outputJson: JSON.stringify(suggestions),
          model: AI_MODEL,
        })
      } catch (error) {
        logger.error(
          {
            error,
            userId,
            featureType: type,
            scope: "ai-suggestions",
          },
          "Failed to save AI request"
        )
      }

      return suggestions
    },

    async getDocumentReview(userId, paragraphs) {
      const inputText = paragraphs.map((p) => p.text).join("\n")
      const items = await getDocumentReview(paragraphs)

      try {
        await aiRequestRepository.saveRequest({
          userId: userId as string,
          featureType: "document-review",
          inputText,
          outputJson: JSON.stringify(items),
          model: AI_MODEL,
        })
      } catch (error) {
        logger.error(
          {
            error,
            userId,
            featureType: "document-review",
            scope: "ai-document-review",
          },
          "Failed to save AI request"
        )
      }

      return items
    },

    async getFlowReview(userId, paragraphs) {
      const inputText = paragraphs.map((p) => p.text).join("\n")
      const items = await getFlowReview(paragraphs)

      try {
        await aiRequestRepository.saveRequest({
          userId: userId as string,
          featureType: "flow-review",
          inputText,
          outputJson: JSON.stringify(items),
          model: AI_MODEL,
        })
      } catch (error) {
        logger.error(
          {
            error,
            userId,
            featureType: "flow-review",
            scope: "ai-flow-review",
          },
          "Failed to save AI request"
        )
      }

      return items
    },
  }
}
