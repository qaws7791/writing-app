import { createRoute, z } from "@hono/zod-openapi"
import {
  syncPushBodySchema,
  syncPushResponseSchema,
  writingIdParamSchema,
} from "@workspace/core/modules/writings"
import { toWritingId } from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { BODY_LIMITS, withBodyLimit } from "../../http/body-limit-middleware"

const route = createRoute({
  description: "에디터 트랜잭션을 서버에 푸시하여 동기화합니다.",
  method: "post",
  path: "/writings/{writingId}/sync/push",
  request: {
    body: {
      content: {
        "application/json": {
          schema: syncPushBodySchema,
        },
      },
      required: true,
    },
    params: z.object({
      writingId: writingIdParamSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: syncPushResponseSchema,
        },
      },
      description: "동기화 결과 (승인 또는 충돌)",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "트랜잭션 푸시",
  tags: ["동기화"],
})

const app = createRouter()

app.use(withBodyLimit(BODY_LIMITS.syncPush))

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { writingId } = c.req.valid("param")
  const body = c.req.valid("json")
  const { writingSyncUseCases } = c.var.services
  const result = await writingSyncUseCases.pushTransactions(
    userId,
    toWritingId(writingId),
    body
  )
  return c.json(result, 200)
})

export default app
