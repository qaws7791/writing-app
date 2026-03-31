import {
  aiSuggestionInputSchema,
  aiSuggestionResponseSchema,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { createAiRateLimiter } from "../../middleware/ai-rate-limiter"
import { AiUseCases } from "../../runtime/tokens"

export default route({
  method: "post",
  path: "/ai/suggestions",
  inject: { aiUseCases: AiUseCases },
  middleware: [createAiRateLimiter({ limit: 20, windowMs: 60 * 1000 })],
  request: { body: aiSuggestionInputSchema },
  response: { 200: aiSuggestionResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "선택한 텍스트에 대한 AI 표현 개선 제안을 생성합니다.",
    summary: "AI 표현 제안",
    tags: ["AI 보조"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ aiUseCases, body, context }) => {
    const userId = requireUserId(context)
    const suggestions = await aiUseCases.getSuggestions(
      userId,
      body.text,
      body.type
    )
    return { suggestions }
  },
})
