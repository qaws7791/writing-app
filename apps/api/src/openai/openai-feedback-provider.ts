import type { AiFeedbackProvider } from "@workspace/core/ai-feedback"
import { aiFeedbackPayloadSchema } from "@workspace/core/ai-feedback"
import { err, ok } from "@workspace/core/result"

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
          input: [
            `레슨 제목: ${input.lessonTitle}`,
            `코칭 초점: ${input.focus}`,
            "학습자 답변:",
            input.answer,
          ].join("\n"),
          instructions: [
            "당신은 한국어 글쓰기 학습자를 돕는 코치입니다.",
            "답변은 반드시 JSON schema에 맞춰 한국어로 작성합니다.",
            "칭찬은 구체적으로, 개선점은 다음 시도에서 바로 적용할 수 있게 씁니다.",
            "점수는 0부터 100 사이 정수로 판단합니다.",
          ].join("\n"),
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
