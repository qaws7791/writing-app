import type { AiFeedbackPayload } from "@workspace/contracts/ai-feedback"
import type { AiFeedbackPrompt } from "#core/modules/ai-feedback/domain/ai-feedback.prompt"
import type { Result } from "#core/shared/result"

export type AiFeedbackProviderInput = AiFeedbackPrompt

export type AiFeedbackProviderError = {
  readonly kind: "provider-unavailable"
}

export type AiFeedbackProvider = {
  readonly createFeedback: (
    input: AiFeedbackProviderInput,
    options?: { readonly signal?: AbortSignal }
  ) => Promise<Result<AiFeedbackPayload, AiFeedbackProviderError>>
}
