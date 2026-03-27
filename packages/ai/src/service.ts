import { generateText, Output } from "ai"
import type { LanguageModel } from "ai"
import type {
  AIReviewParagraph,
  AISuggestionInput,
  ReviewItem,
} from "@workspace/core"

import { buildSuggestionPrompt } from "./prompts/suggestion-prompt"
import { buildDocumentReviewPrompt } from "./prompts/review-prompt"
import { buildFlowReviewPrompt } from "./prompts/flow-prompt"
import { aiSuggestionOutputSchema } from "./schemas/suggestion-schema"
import { reviewItemOutputSchema } from "./schemas/review-schema"
import type { AIService } from "./port"

let idCounter = 0
function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`
}

export function createAIService(model: LanguageModel): AIService {
  return {
    async getSuggestions({ text, type }: AISuggestionInput) {
      const { system, prompt } = buildSuggestionPrompt(text, type)

      const { output } = await generateText({
        model,
        system,
        prompt,
        output: Output.object({ schema: aiSuggestionOutputSchema }),
      })

      if (!output) {
        return []
      }

      return output.suggestions.map((s) => ({
        id: uid(type),
        original: text,
        suggestion: s.suggestion,
        reason: s.reason,
      }))
    },

    async getDocumentReview(paragraphs: AIReviewParagraph[]) {
      const { system, prompt } = buildDocumentReviewPrompt(paragraphs)

      const { output } = await generateText({
        model,
        system,
        prompt,
        output: Output.object({ schema: reviewItemOutputSchema }),
      })

      if (!output) {
        return []
      }

      return output.items.map((item) => ({
        id: uid(item.type),
        type: item.type,
        from: item.from,
        to: item.to,
        original: item.original,
        suggestion: item.suggestion,
        reason: item.reason,
      }))
    },

    async getFlowReview(paragraphs: AIReviewParagraph[]) {
      const { system, prompt } = buildFlowReviewPrompt(paragraphs)

      const { output } = await generateText({
        model,
        system,
        prompt,
        output: Output.object({ schema: reviewItemOutputSchema }),
      })

      if (!output) {
        return []
      }

      return output.items.map((item) => ({
        id: uid("flow"),
        type: "flow" as const,
        from: item.from,
        to: item.to,
        original: item.original,
        suggestion: item.suggestion,
        reason: item.reason,
      }))
    },
  }
}
