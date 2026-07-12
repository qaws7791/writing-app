import type { AiFeedbackPayload } from "#core/modules/ai-feedback/domain/ai-feedback.dto"
import type { AiFeedbackPrompt } from "#core/modules/ai-feedback/domain/ai-feedback.prompt"
import type { Result } from "#core/shared/result"

export type AiFeedbackProviderInput = AiFeedbackPrompt

export type AiFeedbackProviderError = {
  readonly kind: "provider-unavailable"
}

export type AiFeedbackProvider = {
  readonly createFeedback: (
    input: AiFeedbackProviderInput
  ) => Promise<Result<AiFeedbackPayload, AiFeedbackProviderError>>
}
