import {
  generateTextFeedbackBodySchema,
  writingFeedbackSchema,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { GenerateFeedbackUseCase } from "../../runtime/tokens"

export default route({
  method: "post",
  path: "/ai/feedback",
  inject: {
    generateFeedback: GenerateFeedbackUseCase,
  },
  request: {
    body: generateTextFeedbackBodySchema,
  },
  response: { 200: writingFeedbackSchema, default: defaultErrorResponse },
  meta: {
    description: "텍스트에 대한 AI 소크라테스식 피드백을 생성합니다.",
    summary: "AI 텍스트 피드백 생성",
    tags: ["AI"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ generateFeedback, body, context }) => {
    requireUserId(context)
    const result = await generateFeedback({
      bodyPlainText: body.text,
      level: body.level,
    })
    return unwrapOrThrow(result)
  },
})
