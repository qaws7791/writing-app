import { createRoute, z } from "@hono/zod-openapi"
import { writingIdParamSchema, toWritingId } from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "특정 글을 영구적으로 삭제합니다.",
  method: "delete",
  path: "/writings/{writingId}",
  request: {
    params: z.object({
      writingId: writingIdParamSchema,
    }),
  },
  responses: {
    204: {
      description: "글 삭제 완료",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "글 삭제",
  tags: ["글"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { writingId } = c.req.valid("param")
  const { writingUseCases } = c.var.services
  await writingUseCases.deleteWriting(userId, toWritingId(writingId))
  return c.body(null, 204)
})

export default app
