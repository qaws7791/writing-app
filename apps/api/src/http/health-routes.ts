import { defineApiRoute } from "@/context/hono-env"
import { jsonResponse } from "@/http/openapi"
import { parseLearnerRouteResponse } from "@/http/learner-response"
import { z } from "@workspace/http-platform/zod"
import type { ApiHealthProbe } from "@/runtime/api-health"

const livenessResponseSchema = z.strictObject({
  ok: z.boolean(),
})

const readinessResponseSchema = z.strictObject({
  checks: z.strictObject({
    database: z.enum(["ready", "unavailable"]),
  }),
  impact: z.enum(["database-dependent-requests-unavailable", "none"]),
  ok: z.boolean(),
})

export function createHealthRoutes(health: ApiHealthProbe) {
  return [
    defineApiRoute({
      method: "get",
      operationId: "getHealth",
      path: "/health",
      responses: {
        200: jsonResponse(
          "API가 요청을 처리할 준비가 됐습니다.",
          readinessResponseSchema
        ),
        503: jsonResponse(
          "API 데이터베이스가 준비되지 않았습니다.",
          readinessResponseSchema
        ),
      },
      summary: "API readiness 조회",
      handler: (context) => {
        const ready = health.isDatabaseReady()
        return context.json(
          parseLearnerRouteResponse(
            context,
            "HealthResponse",
            readinessResponseSchema,
            {
              checks: { database: ready ? "ready" : "unavailable" },
              impact: ready
                ? "none"
                : "database-dependent-requests-unavailable",
              ok: ready,
            }
          ),
          ready ? 200 : 503
        )
      },
    }),
    defineApiRoute({
      method: "get",
      operationId: "getLiveness",
      path: "/health/live",
      responses: {
        200: jsonResponse(
          "API process가 실행 중입니다.",
          livenessResponseSchema
        ),
      },
      summary: "API liveness 조회",
      handler: (context) =>
        context.json(
          parseLearnerRouteResponse(
            context,
            "HealthLivenessResponse",
            livenessResponseSchema,
            { ok: true }
          ),
          200
        ),
    }),
  ] as const
}
