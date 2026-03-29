import { createRoute, z } from "@hono/zod-openapi"
import {
  versionListResponseSchema,
  writingIdParamSchema,
} from "@workspace/core/modules/writings"
import { cursorPageQuerySchema, toWritingId } from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"

const route = createRoute({
  description: "문서의 버전 기록 목록을 조회합니다.",
  method: "get",
  path: "/writings/{writingId}/versions",
  request: {
    params: z.object({
      writingId: writingIdParamSchema,
    }),
    query: cursorPageQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: versionListResponseSchema,
        },
      },
      description: "버전 기록 목록",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "버전 기록 목록",
  tags: ["동기화"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { writingId } = c.req.valid("param")
  const query = c.req.valid("query")
  const result = await c.var.listVersionsUseCase(
    userId,
    toWritingId(writingId),
    query
  )
  const page = unwrapOrThrow(result)
  return c.json(page, 200)
})

export default app
