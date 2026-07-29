import type {
  AiInfrastructureError,
  OpenAiClientRuntime,
} from "@workspace/ai/openai-client"
import { normalizeAiProviderError } from "@workspace/ai/openai-client"
import type { Result } from "@workspace/kernel/result"
import { err, ok } from "@workspace/kernel/result"

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

export function createConfiguredAiFeedbackProvider(input: {
  readonly model: string
  readonly runtime: Result<OpenAiClientRuntime, AiInfrastructureError>
}): AiFeedbackProvider {
  if (input.runtime.isErr()) {
    return createUnavailableAiFeedbackProvider({ model: input.model })
  }

  return createOpenAiFeedbackProvider({
    client: input.runtime.value.client,
    model: input.model,
    timeoutMs: input.runtime.value.timeoutMs,
  })
}

export function createOpenAiFeedbackProvider(input: {
  readonly client: OpenAiResponsesClient
  readonly model: string
  readonly timeoutMs: number
}): AiFeedbackProvider {
  return {
    model: input.model,
    provider: "openai",
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

        const usage = readUsage(response.usage)
        if (response.usage !== undefined && usage === undefined) {
          return err({ kind: "provider-response-invalid" })
        }

        let parsed: unknown
        try {
          parsed = JSON.parse(response.output_text)
        } catch {
          // JSON parse 오류 message는 provider 원문 조각을 포함한다.
          // 이 provider는 원문을 보관하지 않으므로 cause를 의도적으로 버린다.
          // oxlint-disable-next-line workspace/catch-preserves-cause
          return err({
            kind: "provider-response-invalid",
            ...(usage === undefined ? {} : { usage }),
          })
        }
        const feedback = validateAiFeedbackProviderResponse(parsed)
        if (feedback.isErr()) {
          return err({
            ...feedback.error,
            ...(usage === undefined ? {} : { usage }),
          })
        }

        return ok({
          feedback: feedback.value,
          ...(usage === undefined ? {} : { usage }),
        })
      } catch (cause) {
        const error = normalizeAiProviderError(cause, input.timeoutMs)
        switch (error.kind) {
          case "operation-aborted":
            return err({ cause, kind: "request-aborted" })
          case "operation-timed-out":
            return err({ cause, kind: "provider-timeout" })
          case "configuration-invalid":
          case "operation-failed":
            return err({ cause, kind: "provider-unavailable" })
        }
      }
    },
  }
}

function createUnavailableAiFeedbackProvider(
  input: Readonly<{ model?: string }> = {}
): AiFeedbackProvider {
  return {
    model: input.model ?? "unconfigured",
    provider: "openai",
    async createFeedback() {
      return err({ kind: "provider-unavailable" })
    },
  }
}

function readUsage(
  usage:
    | Readonly<{
        input_tokens: number
        output_tokens: number
        total_tokens: number
      }>
    | undefined
) {
  if (usage === undefined) return undefined
  if (
    !Number.isInteger(usage.input_tokens) ||
    usage.input_tokens < 0 ||
    !Number.isInteger(usage.output_tokens) ||
    usage.output_tokens < 0 ||
    !Number.isInteger(usage.total_tokens) ||
    usage.total_tokens < 0
  ) {
    return undefined
  }

  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
  }
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
    strengths: {
      items: { minLength: 1, type: "string" },
      maxItems: 20,
      minItems: 1,
      type: "array",
    },
    summary: { minLength: 1, type: "string" },
  },
  required: ["summary", "strengths", "improvements", "nextAction"],
  type: "object",
} as const
