import { createRoute } from "@hono/zod-openapi"
import { homeSnapshotSchema } from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"

const route = createRoute({
  description:
    "오늘의 글감, 최근 글, 이어쓸 글, 저장된 글감을 한 번에 조회합니다.",
  method: "get",
  path: "/home",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: homeSnapshotSchema,
        },
      },
      description: "홈 스냅샷",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "홈 조회",
  tags: ["홈"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const result = await c.var.getHomeUseCase(userId)
  const home = unwrapOrThrow(result)
  return c.json(home, 200)
})

export default app
