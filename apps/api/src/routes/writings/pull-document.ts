import { createRoute, z } from "@hono/zod-openapi"
import {
  syncPullQuerySchema,
  syncPullResponseSchema,
  writingIdParamSchema,
} from "@workspace/core/modules/writings"
import { toWritingId } from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "서버에서 최신 문서 상태를 가져옵니다.",
  method: "get",
  path: "/writings/{writingId}/sync/pull",
  request: {
    params: z.object({
      writingId: writingIdParamSchema,
    }),
    query: syncPullQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: syncPullResponseSchema,
        },
      },
      description: "현재 문서 상태",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "문서 상태 풀",
  tags: ["동기화"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { writingId } = c.req.valid("param")
  const query = c.req.valid("query")
  const { writingSyncUseCases } = c.var.services
  const result = await writingSyncUseCases.pullDocument(
    userId,
    toWritingId(writingId),
    query.since
  )
  return c.json(result, 200)
})

export default app
