import OpenAI from "openai"
import {
  APIConnectionTimeoutError,
  APIError,
  RateLimitError,
} from "openai/core/error"
import { zodTextFormat } from "openai/helpers/zod"
import { z } from "zod"

import type {
  AiFeedbackProvider,
  AiFeedbackProviderErrorKind,
} from "@workspace/core/ai-feedback"
import { aiFeedbackResultDtoSchema } from "@workspace/core/ai-feedback"

interface OpenAiFeedbackClient {
  responses: {
    parse(input: unknown): Promise<{
      output_parsed?: unknown
    }>
  }
}

const openAiFeedbackResultDtoSchema = aiFeedbackResultDtoSchema.extend({
  scoreRange: z.array(z.number().int()).length(2),
})

export function createOpenAiFeedbackProvider(input: {
  apiKey?: string
  client?: OpenAiFeedbackClient
  model: string
}): AiFeedbackProvider {
  const client = input.client ?? new OpenAI({ apiKey: input.apiKey })

  return {
    async createFeedback(feedbackInput) {
      try {
        const response = await client.responses.parse({
          input: [
            {
              role: "system",
              content:
                "너는 한국어 글쓰기 학습자를 돕는 피드백 코치다. 결과는 요청된 JSON schema에만 맞춰 작성한다.",
            },
            {
              role: "user",
              content: [
                `평가 지시: ${feedbackInput.prompt}`,
                `평가 기준: ${feedbackInput.criteria}`,
                `초점 영역: ${feedbackInput.focusAreas.join(", ")}`,
                `점수 범위: ${feedbackInput.scoreRange[0]}-${feedbackInput.scoreRange[1]}`,
                `학습자 답변:\n${feedbackInput.answer}`,
              ].join("\n\n"),
            },
          ],
          model: input.model,
          text: {
            format: zodTextFormat(openAiFeedbackResultDtoSchema, "ai_feedback"),
          },
        })
        const parsed = aiFeedbackResultDtoSchema.safeParse(
          response.output_parsed
        )

        if (!parsed.success) {
          return {
            kind: "provider-invalid-response",
            status: "error",
          }
        }

        return {
          status: "ok",
          value: parsed.data,
        }
      } catch (error) {
        return {
          kind: classifyOpenAiError(error),
          status: "error",
        }
      }
    },
  }
}

function classifyOpenAiError(error: unknown): AiFeedbackProviderErrorKind {
  if (error instanceof APIConnectionTimeoutError) {
    return "timeout"
  }

  if (error instanceof RateLimitError || getStatusCode(error) === 429) {
    return "rate-limited"
  }

  const statusCode = getStatusCode(error)

  if (
    statusCode === 400 ||
    statusCode === 401 ||
    statusCode === 403 ||
    statusCode === 422
  ) {
    return "provider-invalid-request"
  }

  return "unavailable"
}

function getStatusCode(error: unknown) {
  if (error instanceof APIError) {
    return error.status
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status
  }

  return undefined
}
