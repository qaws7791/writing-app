import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand"
import type { UserLevel, WritingFeedback } from "../ai-feedback-types"
import type { AiCoachingGateway } from "../ai-feedback-port"

export type GenerateFeedbackDeps = {
  readonly aiCoachingGateway: AiCoachingGateway
}

export type GenerateFeedbackInput = {
  readonly userId: UserId
  readonly bodyPlainText: string
  readonly level?: UserLevel
}

export function makeGenerateFeedbackUseCase(deps: GenerateFeedbackDeps) {
  return (input: GenerateFeedbackInput): ResultAsync<WritingFeedback, never> =>
    // TODO: userId를 사용량 집계 및 남용 탐지에 활용 (AI 호출 로그 DB 저장)
    ResultAsync.fromSafePromise(
      deps.aiCoachingGateway.generateFeedback({
        bodyPlainText: input.bodyPlainText,
        level: input.level ?? "beginner",
      })
    )
}
