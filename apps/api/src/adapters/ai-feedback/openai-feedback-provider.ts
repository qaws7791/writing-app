import { aiFeedbackPayloadSchema } from "@workspace/contracts/ai-feedback/feedback"
import type { AiFeedbackProvider } from "@workspace/core/ai-feedback"
import { err, ok } from "@workspace/kernel/result"
import { createOpenAiClient } from "@workspace/ai/openai-client"

export type OpenAiResponseCreateRequest = {
  readonly input: string
  readonly instructions: string
  readonly model: string
  readonly text: {
    readonly format: {
      readonly name: "writing_app_ai_feedback"
      readonly schema: typeof aiFeedbackJsonSchema
      readonly strict: true
      readonly type: "json_schema"
    }
  }
}

export type OpenAiResponsesClient = {
  readonly responses: {
    readonly create: (
      request: OpenAiResponseCreateRequest,
      options?: { readonly signal?: AbortSignal }
    ) => Promise<{
      readonly output_text: string
      readonly usage?: {
        readonly input_tokens: number
        readonly output_tokens: number
        readonly total_tokens: number
      }
    }>
  }
}

export type OpenAiUsageEvent = {
  readonly inputTokens: number
  readonly model: string
  readonly outputTokens: number
  readonly totalTokens: number
}

export function createConfiguredAiFeedbackProvider({
  apiKey,
  model,
  onUsage,
}: {
  readonly apiKey?: string
  readonly model: string
  readonly onUsage?: (event: OpenAiUsageEvent) => void
}): AiFeedbackProvider {
  const clientResult = createOpenAiClient({ apiKey, timeoutMs: 30_000 })
  if (clientResult.isErr()) return createUnavailableAiFeedbackProvider()

  return createOpenAiFeedbackProvider({
    client: clientResult.value.client,
    model,
    onUsage,
  })
}

export function createOpenAiFeedbackProvider({
  client,
  model,
  onUsage,
}: {
  readonly client: OpenAiResponsesClient
  readonly model: string
  readonly onUsage?: (event: OpenAiUsageEvent) => void
}): AiFeedbackProvider {
  return {
    async createFeedback(input, options) {
      try {
        const response = await client.responses.create(
          {
            input: input.input,
            instructions: input.instructions,
            model,
            text: {
              format: {
                name: "writing_app_ai_feedback",
                schema: aiFeedbackJsonSchema,
                strict: true,
                type: "json_schema",
              },
            },
          },
          { signal: options?.signal }
        )

        if (response.usage !== undefined) {
          onUsage?.({
            inputTokens: response.usage.input_tokens,
            model,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.total_tokens,
          })
        }

        return ok(
          aiFeedbackPayloadSchema.parse(JSON.parse(response.output_text))
        )
      } catch {
        return err({ kind: "provider-unavailable" })
      }
    },
  }
}

export function createUnavailableAiFeedbackProvider(): AiFeedbackProvider {
  return {
    async createFeedback() {
      return err({ kind: "provider-unavailable" })
    },
  }
}

const aiFeedbackJsonSchema = {
  additionalProperties: false,
  properties: {
    improvements: {
      items: {
        minLength: 1,
        type: "string",
      },
      minItems: 1,
      type: "array",
    },
    nextAction: {
      minLength: 1,
      type: "string",
    },
    score: {
      maximum: 100,
      minimum: 0,
      type: "integer",
    },
    scoreRange: {
      items: {
        enum: [0, 100],
        type: "integer",
      },
      maxItems: 2,
      minItems: 2,
      type: "array",
    },
    showScore: {
      type: "boolean",
    },
    strengths: {
      items: {
        minLength: 1,
        type: "string",
      },
      minItems: 1,
      type: "array",
    },
    summary: {
      minLength: 1,
      type: "string",
    },
  },
  required: [
    "summary",
    "strengths",
    "improvements",
    "nextAction",
    "score",
    "scoreRange",
    "showScore",
  ],
  type: "object",
} as const
