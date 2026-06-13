import type { AiFeedbackPayload } from "@workspace/core/ai-feedback/ai-feedback.dto"
import type { Result } from "@workspace/core/result"

export type AiFeedbackProviderInput = {
  readonly answer: string
  readonly focus: string
  readonly lessonTitle: string
}

export type AiFeedbackProviderError = {
  readonly kind: "provider-unavailable"
}

export type AiFeedbackProvider = {
  readonly createFeedback: (
    input: AiFeedbackProviderInput
  ) => Promise<Result<AiFeedbackPayload, AiFeedbackProviderError>>
}
