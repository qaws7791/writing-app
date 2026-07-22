import { defineApiRoute } from "@/context/hono-env"
import { jsonResponse } from "@/http/openapi"
import { parseLearnerRouteResponse } from "@/http/learner-response"
import { z } from "@workspace/http-platform/zod"
import type { ApiHealthProbe } from "@/runtime/api-health"

const healthResponseSchema = z.strictObject({
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
          healthResponseSchema
        ),
        503: jsonResponse(
          "API 데이터베이스가 준비되지 않았습니다.",
          healthResponseSchema
        ),
      },
      summary: "API readiness 조회",
      handler: (context) => {
        const ready = health.isDatabaseReady()
        return context.json(
          parseLearnerRouteResponse(
            context,
            "HealthResponse",
            healthResponseSchema,
            { ok: ready }
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
        200: jsonResponse("API process가 실행 중입니다.", healthResponseSchema),
      },
      summary: "API liveness 조회",
      handler: (context) =>
        context.json(
          parseLearnerRouteResponse(
            context,
            "HealthLivenessResponse",
            healthResponseSchema,
            { ok: true }
          ),
          200
        ),
    }),
  ] as const
}
