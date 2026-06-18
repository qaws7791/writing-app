import type { AiFeedbackPayload } from "@workspace/core/modules/ai-feedback/domain/ai-feedback.dto"
import type { AiFeedbackPrompt } from "@workspace/core/modules/ai-feedback/domain/ai-feedback.prompt"
import type { Result } from "@workspace/core/shared/result"

export type AiFeedbackProviderInput = AiFeedbackPrompt

export type AiFeedbackProviderError = {
  readonly kind: "provider-unavailable"
}

export type AiFeedbackProvider = {
  readonly createFeedback: (
    input: AiFeedbackProviderInput
  ) => Promise<Result<AiFeedbackPayload, AiFeedbackProviderError>>
}
