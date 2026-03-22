import { createRoute, z } from "@hono/zod-openapi"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"

const healthResponseSchema = z.object({
  sqliteVersion: z.string(),
  status: z.literal("ok"),
})

const route = createRoute({
  description: "서버 상태와 SQLite 버전을 확인합니다.",
  method: "get",
  path: "/health",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: healthResponseSchema,
        },
      },
      description: "서버 정상",
    },
    default: defaultErrorResponse,
  },
  summary: "헬스 체크",
  tags: ["시스템"],
})

const app = createRouter()

app.openapi(route, (c) => {
  const { sqliteVersion } = c.var.services
  return c.json({ sqliteVersion, status: "ok" as const }, 200)
})

export default app
