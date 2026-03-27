import { createRoute, z } from "@hono/zod-openapi"
import {
  aiDocumentReviewInputSchema,
  aiReviewResponseSchema,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "문서 전체의 맞춤법 및 중복 표현을 검토합니다.",
  method: "post",
  path: "/ai/review/document",
  request: {
    body: {
      content: {
        "application/json": {
          schema: aiDocumentReviewInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: aiReviewResponseSchema,
        },
      },
      description: "검토 결과",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "AI 문서 검토",
  tags: ["AI 보조"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { paragraphs } = c.req.valid("json")
  const { aiUseCases } = c.var.services

  const items = await aiUseCases.getDocumentReview(userId, paragraphs)
  return c.json({ items }, 200)
})

export default app
