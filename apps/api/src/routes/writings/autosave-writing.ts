import { createRoute, z } from "@hono/zod-openapi"
import {
  autosaveWritingBodySchema,
  autosaveWritingResponseSchema,
  writingIdParamSchema,
  toWritingId,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { BODY_LIMITS, withBodyLimit } from "../../http/body-limit-middleware"

const route = createRoute({
  description: "글의 제목 또는 본문을 자동 저장합니다.",
  method: "patch",
  path: "/writings/{writingId}",
  request: {
    body: {
      content: {
        "application/json": {
          schema: autosaveWritingBodySchema,
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
          schema: autosaveWritingResponseSchema,
        },
      },
      description: "자동 저장 완료",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "글 자동 저장",
  tags: ["글"],
})

const app = createRouter()

app.use(withBodyLimit(BODY_LIMITS.document))

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { writingId } = c.req.valid("param")
  const body = c.req.valid("json")
  const { writingUseCases } = c.var.services
  const result = await writingUseCases.autosaveWriting(
    userId,
    toWritingId(writingId),
    body
  )
  return c.json(result, 200)
})

export default app
