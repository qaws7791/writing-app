import { createRoute } from "@hono/zod-openapi"
import {
  createDraftBodySchema,
  draftDetailSchema,
  toPromptId,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "새 초안을 생성합니다. 글감을 기반으로 생성할 수 있습니다.",
  method: "post",
  path: "/drafts",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createDraftBodySchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: draftDetailSchema,
        },
      },
      description: "초안 생성 완료",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "초안 생성",
  tags: ["초안"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const body = c.req.valid("json")
  const { draftUseCases } = c.var.services
  const draft = await draftUseCases.createDraft(userId, {
    content: body.content,
    sourcePromptId:
      body.sourcePromptId === undefined
        ? undefined
        : toPromptId(body.sourcePromptId),
    title: body.title,
  })
  return c.json(draft, 201)
})

export default app
