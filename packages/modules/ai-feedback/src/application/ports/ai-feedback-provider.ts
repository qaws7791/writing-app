import type { Result } from "@workspace/kernel/result"

import type { AiFeedbackProviderResponse } from "#ai-feedback/domain/ai-feedback"
import type { AiFeedbackPrompt } from "#ai-feedback/domain/ai-feedback-prompt"

type AiFeedbackProviderUsage = Readonly<{
  inputTokens: number
  outputTokens: number
}>

export type AiFeedbackProviderError = Readonly<{
  kind:
    | "provider-response-invalid"
    | "provider-timeout"
    | "provider-unavailable"
    | "request-aborted"
  usage?: AiFeedbackProviderUsage
}>

export type AiFeedbackProviderSuccess = Readonly<{
  feedback: AiFeedbackProviderResponse
  usage?: AiFeedbackProviderUsage
}>

export type AiFeedbackProvider = Readonly<{
  model: string
  provider: string
  createFeedback: (
    prompt: AiFeedbackPrompt,
    options: Readonly<{ signal: AbortSignal }>
  ) => Promise<Result<AiFeedbackProviderSuccess, AiFeedbackProviderError>>
}>
