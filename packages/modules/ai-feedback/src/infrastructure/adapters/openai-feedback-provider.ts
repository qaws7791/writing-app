import type {
  AiInfrastructureError,
  OpenAiClientRuntime,
} from "@workspace/ai/openai-client"
import { normalizeAiProviderError } from "@workspace/ai/openai-client"
import type { Result } from "@workspace/kernel/result"
import { err } from "@workspace/kernel/result"

import type { AiFeedbackProvider } from "#ai-feedback/application/ports/ai-feedback-provider"
import { validateAiFeedbackProviderResponse } from "#ai-feedback/domain/ai-feedback"

export type OpenAiResponseCreateRequest = Readonly<{
  input: string
  instructions: string
  model: string
  text: Readonly<{
    format: Readonly<{
      name: "writing_app_ai_feedback"
      schema: typeof aiFeedbackJsonSchema
      strict: true
      type: "json_schema"
    }>
  }>
}>

export type OpenAiResponsesClient = Readonly<{
  responses: Readonly<{
    create: (
      request: OpenAiResponseCreateRequest,
      options: Readonly<{ signal: AbortSignal }>
    ) => Promise<
      Readonly<{
        output_text: string
        usage?: Readonly<{
          input_tokens: number
          output_tokens: number
          total_tokens: number
        }>
      }>
    >
  }>
}>

export type OpenAiUsageEvent = Readonly<{
  inputTokens: number
  model: string
  outputTokens: number
  totalTokens: number
}>

export function createConfiguredAiFeedbackProvider(input: {
  readonly model: string
  readonly onUsage?: (event: OpenAiUsageEvent) => void
  readonly runtime: Result<OpenAiClientRuntime, AiInfrastructureError>
}): AiFeedbackProvider {
  if (input.runtime.isErr()) return createUnavailableAiFeedbackProvider()

  return createOpenAiFeedbackProvider({
    client: input.runtime.value.client,
    model: input.model,
    onUsage: input.onUsage,
    timeoutMs: input.runtime.value.timeoutMs,
  })
}

export function createOpenAiFeedbackProvider(input: {
  readonly client: OpenAiResponsesClient
  readonly model: string
  readonly onUsage?: (event: OpenAiUsageEvent) => void
  readonly timeoutMs: number
}): AiFeedbackProvider {
  return Object.freeze({
    async createFeedback(prompt, options) {
      try {
        const response = await input.client.responses.create(
          {
            input: prompt.input,
            instructions: prompt.instructions,
            model: input.model,
            text: {
              format: {
                name: "writing_app_ai_feedback",
                schema: aiFeedbackJsonSchema,
                strict: true,
                type: "json_schema",
              },
            },
          },
          { signal: options.signal }
        )

        if (response.usage !== undefined) {
          input.onUsage?.(
            Object.freeze({
              inputTokens: response.usage.input_tokens,
              model: input.model,
              outputTokens: response.usage.output_tokens,
              totalTokens: response.usage.total_tokens,
            })
          )
        }

        let parsed: unknown
        try {
          parsed = JSON.parse(response.output_text)
        } catch {
          return err({ kind: "provider-response-invalid" })
        }
        return validateAiFeedbackProviderResponse(parsed)
      } catch (cause) {
        const error = normalizeAiProviderError(cause, input.timeoutMs)
        switch (error.kind) {
          case "operation-aborted":
            return err({ kind: "request-aborted" })
          case "operation-timed-out":
            return err({ kind: "provider-timeout" })
          case "configuration-invalid":
          case "operation-failed":
            return err({ kind: "provider-unavailable" })
        }
      }
    },
  })
}

export function createUnavailableAiFeedbackProvider(): AiFeedbackProvider {
  return Object.freeze({
    async createFeedback() {
      return err({ kind: "provider-unavailable" })
    },
  })
}

const aiFeedbackJsonSchema = {
  additionalProperties: false,
  properties: {
    improvements: {
      items: { minLength: 1, type: "string" },
      maxItems: 20,
      minItems: 1,
      type: "array",
    },
    nextAction: { minLength: 1, type: "string" },
    score: { maximum: 100, minimum: 0, type: "integer" },
    strengths: {
      items: { minLength: 1, type: "string" },
      maxItems: 20,
      minItems: 1,
      type: "array",
    },
    summary: { minLength: 1, type: "string" },
  },
  required: ["summary", "strengths", "improvements", "nextAction", "score"],
  type: "object",
} as const
