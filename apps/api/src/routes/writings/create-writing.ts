import { createRoute } from "@hono/zod-openapi"
import {
  createWritingBodySchema,
  writingDetailSchema,
  toPromptId,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"

const route = createRoute({
  description: "새 글을 생성합니다. 글감을 기반으로 생성할 수 있습니다.",
  method: "post",
  path: "/writings",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createWritingBodySchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: writingDetailSchema,
        },
      },
      description: "글 생성 완료",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "글 생성",
  tags: ["글"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const body = c.req.valid("json")
  const result = await c.var.createWritingUseCase(userId, {
    content: body.content,
    sourcePromptId:
      body.sourcePromptId === undefined
        ? undefined
        : toPromptId(body.sourcePromptId),
    title: body.title,
  })
  const writing = unwrapOrThrow(result)
  return c.json(writing, 201)
})

export default app
