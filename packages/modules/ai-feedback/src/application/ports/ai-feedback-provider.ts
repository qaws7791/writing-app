import type { Result } from "@workspace/kernel/result"

import type {
  AiFeedbackProviderResponse,
  AiFeedbackProviderResponseError,
} from "#ai-feedback/domain/ai-feedback"
import type { AiFeedbackPrompt } from "#ai-feedback/domain/ai-feedback-prompt"

export type AiFeedbackProviderError =
  | AiFeedbackProviderResponseError
  | Readonly<{
      kind: "provider-timeout" | "provider-unavailable" | "request-aborted"
    }>

export type AiFeedbackProvider = Readonly<{
  createFeedback: (
    prompt: AiFeedbackPrompt,
    options: Readonly<{ signal: AbortSignal }>
  ) => Promise<Result<AiFeedbackProviderResponse, AiFeedbackProviderError>>
}>
