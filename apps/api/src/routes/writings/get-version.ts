import { createRoute, z } from "@hono/zod-openapi"
import {
  writingVersionDetailSchema,
  writingIdParamSchema,
  versionParamSchema,
} from "@workspace/core/modules/writings"
import { toDraftId } from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "특정 버전의 문서 스냅샷을 조회합니다.",
  method: "get",
  path: "/writings/{writingId}/versions/{version}",
  request: {
    params: z.object({
      writingId: writingIdParamSchema,
      version: versionParamSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: writingVersionDetailSchema,
        },
      },
      description: "버전 상세 정보",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "버전 상세 조회",
  tags: ["동기화"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { writingId, version } = c.req.valid("param")
  const { writingUseCases } = c.var.services
  const result = await writingUseCases.getVersion(
    userId,
    toDraftId(writingId),
    version
  )
  return c.json(result, 200)
})

export default app
