import type { AiFeedbackResultDto } from "./ai-feedback.dto"

export type AiFeedbackProviderErrorKind =
  | "provider-invalid-request"
  | "provider-invalid-response"
  | "rate-limited"
  | "timeout"
  | "unavailable"

export type AiFeedbackProviderResult =
  | {
      readonly status: "ok"
      readonly value: AiFeedbackResultDto
    }
  | {
      readonly status: "error"
      readonly kind: AiFeedbackProviderErrorKind
    }

export interface AiFeedbackProvider {
  createFeedback(input: {
    answer: string
    criteria: string
    focusAreas: string[]
    prompt: string
    scoreRange: readonly [number, number]
  }): Promise<AiFeedbackProviderResult>
}
