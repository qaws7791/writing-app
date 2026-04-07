import { generateText, Output } from "ai"
import type { LanguageModel } from "ai"
import type {
  AiCoachingGateway,
  GenerateFeedbackInput,
  CompareRevisionsInput,
} from "@workspace/core"

import { buildFeedbackPrompt } from "./prompts/feedback-prompt"
import { buildComparePrompt } from "./prompts/compare-prompt"
import { feedbackOutputSchema } from "./schemas/feedback-schema"
import { compareOutputSchema } from "./schemas/compare-schema"

export function createAiCoachingService(
  model: LanguageModel
): AiCoachingGateway {
  return {
    async generateFeedback({ bodyPlainText, level }: GenerateFeedbackInput) {
      const { system, prompt } = buildFeedbackPrompt(bodyPlainText, level)

      const { output } = await generateText({
        model,
        system,
        prompt,
        output: Output.object({ schema: feedbackOutputSchema }),
      })

      if (!output) {
        return { strengths: [], improvements: [], question: "" }
      }

      return output
    },

    async compareRevisions({
      originalText,
      revisedText,
    }: CompareRevisionsInput) {
      const { system, prompt } = buildComparePrompt(originalText, revisedText)

      const { output } = await generateText({
        model,
        system,
        prompt,
        output: Output.object({ schema: compareOutputSchema }),
      })

      if (!output) {
        return { improvements: [], summary: "" }
      }

      return output
    },
  }
}
