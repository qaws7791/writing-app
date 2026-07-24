import { createRoute, type OpenAPIHono } from "@hono/zod-openapi"
import { jsonResponse, z } from "@workspace/http-platform/openapi"

import type { ApiHonoEnv } from "@/context/hono-env"
import { parseLearnerRouteResponse } from "@/http/learner-response"
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

export function registerHealthRoutes(
  app: OpenAPIHono<ApiHonoEnv>,
  health: ApiHealthProbe
): void {
  const readinessRoute = createRoute({
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
  })
  app.openapi(readinessRoute, (context) => {
    const ready = health.isDatabaseReady()
    return context.json(
      parseLearnerRouteResponse(
        context,
        "HealthResponse",
        readinessResponseSchema,
        {
          checks: { database: ready ? "ready" : "unavailable" },
          impact: ready ? "none" : "database-dependent-requests-unavailable",
          ok: ready,
        }
      ),
      ready ? 200 : 503
    )
  })

  const livenessRoute = createRoute({
    method: "get",
    operationId: "getLiveness",
    path: "/health/live",
    responses: {
      200: jsonResponse("API process가 실행 중입니다.", livenessResponseSchema),
    },
    summary: "API liveness 조회",
  })
  app.openapi(livenessRoute, (context) =>
    context.json(
      parseLearnerRouteResponse(
        context,
        "HealthLivenessResponse",
        livenessResponseSchema,
        { ok: true }
      ),
      200
    )
  )
}
