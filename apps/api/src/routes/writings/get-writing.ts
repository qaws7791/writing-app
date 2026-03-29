import { createRoute, z } from "@hono/zod-openapi"
import {
  writingDetailSchema,
  writingIdParamSchema,
  toWritingId,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"

const route = createRoute({
  description: "특정 글의 전체 내용을 조회합니다.",
  method: "get",
  path: "/writings/{writingId}",
  request: {
    params: z.object({
      writingId: writingIdParamSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: writingDetailSchema,
        },
      },
      description: "글 상세",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "글 상세 조회",
  tags: ["글"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { writingId } = c.req.valid("param")
  const result = await c.var.getWritingUseCase(userId, toWritingId(writingId))
  const writing = unwrapOrThrow(result)
  return c.json(writing, 200)
})

export default app
