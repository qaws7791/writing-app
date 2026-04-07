import { ResultAsync } from "neverthrow"

import type { UserLevel, WritingFeedback } from "../ai-feedback-types"
import type { AiCoachingGateway } from "../ai-feedback-port"

export type GenerateFeedbackDeps = {
  readonly aiCoachingGateway: AiCoachingGateway
}

export type GenerateFeedbackInput = {
  readonly bodyPlainText: string
  readonly level?: UserLevel
}

export function makeGenerateFeedbackUseCase(deps: GenerateFeedbackDeps) {
  return (input: GenerateFeedbackInput): ResultAsync<WritingFeedback, never> =>
    ResultAsync.fromSafePromise(
      deps.aiCoachingGateway.generateFeedback({
        bodyPlainText: input.bodyPlainText,
        level: input.level ?? "beginner",
      })
    )
}
