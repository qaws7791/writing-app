import { generateText, Output } from "ai"
import type {
  AIFeatureType,
  AIReviewParagraph,
  AISuggestion,
  ReviewItem,
} from "@workspace/core"

import { createAIModel } from "./provider"
import { buildSuggestionPrompt } from "./prompts/suggestion-prompt"
import { buildDocumentReviewPrompt } from "./prompts/review-prompt"
import { buildFlowReviewPrompt } from "./prompts/flow-prompt"
import { aiSuggestionOutputSchema } from "./schemas/suggestion-schema"
import { reviewItemOutputSchema } from "./schemas/review-schema"

let idCounter = 0
function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`
}

export async function getAISuggestions(
  text: string,
  type: AIFeatureType
): Promise<AISuggestion[]> {
  const model = createAIModel()
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
}

export async function getDocumentReview(
  paragraphs: AIReviewParagraph[]
): Promise<ReviewItem[]> {
  const model = createAIModel()
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
}

export async function getFlowReview(
  paragraphs: AIReviewParagraph[]
): Promise<ReviewItem[]> {
  const model = createAIModel()
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
    type: "flow",
    from: item.from,
    to: item.to,
    original: item.original,
    suggestion: item.suggestion,
    reason: item.reason,
  }))
}
