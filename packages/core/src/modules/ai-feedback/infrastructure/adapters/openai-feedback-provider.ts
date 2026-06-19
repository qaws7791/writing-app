import type { AiFeedbackProvider } from "@workspace/core/modules/ai-feedback/application/ports/ai-feedback.provider"
import { aiFeedbackPayloadSchema } from "@workspace/core/modules/ai-feedback/domain/ai-feedback.dto"
import { err, ok } from "@workspace/core/shared/result"

export type OpenAiResponseCreateRequest = {
  readonly input: string
  readonly instructions: string
  readonly model: string
  readonly text: {
    readonly format: {
      readonly name: "kwep_ai_feedback"
      readonly schema: typeof aiFeedbackJsonSchema
      readonly strict: true
      readonly type: "json_schema"
    }
  }
}

export type OpenAiResponsesClient = {
  readonly responses: {
    readonly create: (request: OpenAiResponseCreateRequest) => Promise<{
      readonly output_text: string
    }>
  }
}

export function createOpenAiFeedbackProvider({
  client,
  model,
}: {
  readonly client: OpenAiResponsesClient
  readonly model: string
}): AiFeedbackProvider {
  return {
    async createFeedback(input) {
      try {
        const response = await client.responses.create({
          input: input.input,
          instructions: input.instructions,
          model,
          text: {
            format: {
              name: "kwep_ai_feedback",
              schema: aiFeedbackJsonSchema,
              strict: true,
              type: "json_schema",
            },
          },
        })

        return ok(
          aiFeedbackPayloadSchema.parse(JSON.parse(response.output_text))
        )
      } catch {
        return err({
          kind: "provider-unavailable",
        })
      }
    },
  }
}

export function createUnavailableAiFeedbackProvider(): AiFeedbackProvider {
  return {
    async createFeedback() {
      return err({
        kind: "provider-unavailable",
      })
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
