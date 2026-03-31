import { z } from "@hono/zod-openapi"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { SqliteVersion } from "../../runtime/tokens"

const healthResponseSchema = z.object({
  sqliteVersion: z.string(),
  status: z.literal("ok"),
})

export default route({
  method: "get",
  path: "/health",
  inject: { sqliteVersion: SqliteVersion },
  response: { 200: healthResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "서버 상태와 SQLite 버전을 확인합니다.",
    summary: "헬스 체크",
    tags: ["시스템"],
  },
  handler: ({ sqliteVersion }) => ({
    sqliteVersion,
    status: "ok" as const,
  }),
})
