import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"

import type { AiFeedbackProvider } from "@workspace/core/ai-feedback"
import { aiFeedbackResultDtoSchema } from "@workspace/core/ai-feedback"

interface OpenAiFeedbackClient {
  responses: {
    parse(input: unknown): Promise<{
      output_parsed?: unknown
    }>
  }
}

export function createOpenAiFeedbackProvider(input: {
  apiKey?: string
  client?: OpenAiFeedbackClient
  model: string
}): AiFeedbackProvider {
  const client = input.client ?? new OpenAI({ apiKey: input.apiKey })

  return {
    async createFeedback(feedbackInput) {
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
          format: zodTextFormat(aiFeedbackResultDtoSchema, "ai_feedback"),
        },
      })
      const parsed = aiFeedbackResultDtoSchema.safeParse(response.output_parsed)

      if (!parsed.success) {
        throw new Error("OpenAI response did not include valid feedback.")
      }

      return parsed.data
    },
  }
}
