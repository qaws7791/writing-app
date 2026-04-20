import { z } from "@hono/zod-openapi"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { HealthCheckUseCase } from "../../runtime/tokens"

const healthResponseSchema = z.object({
  ai: z.object({
    reason: z.string(),
    status: z.enum(["degraded"]),
  }),
  db: z.object({
    latencyMs: z.number().int().nonnegative().nullable(),
    status: z.enum(["degraded", "ok"]),
  }),
  sqliteVersion: z.string(),
  status: z.enum(["degraded", "ok"]),
})

export default route({
  method: "get",
  path: "/health",
  inject: { healthCheckUseCase: HealthCheckUseCase },
  response: { 200: healthResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "DB 쿼리 가능 여부와 AI 서브시스템 상태를 함께 확인합니다.",
    summary: "헬스 체크",
    tags: ["시스템"],
  },
  handler: ({ healthCheckUseCase }) => healthCheckUseCase(),
})
