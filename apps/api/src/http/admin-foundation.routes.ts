import { createRoute, type OpenAPIHono } from "@hono/zod-openapi"
import { adminSessionDtoSchema } from "@workspace/contracts/identity/admin-session"
import type { AdminSessionResolver } from "@workspace/identity/ports"
import { adminSessionRouteOptions } from "@workspace/identity/http"

import type { AdminHonoEnv } from "@/http/admin-hono-env"
import {
  adminAuthenticatedResponses,
  adminHealthResponseSchema,
  adminReadinessResponseSchema,
  jsonResponse,
} from "@/http/admin-openapi"
import type { ApiHealthProbe } from "@/runtime/api-health"

export function registerAdminFoundationRoutes(
  app: OpenAPIHono<AdminHonoEnv>,
  input: {
    readonly health: ApiHealthProbe
    readonly sessionResolver: AdminSessionResolver
  }
): void {
  const readinessRoute = createRoute({
    method: "get",
    operationId: "getAdminHealth",
    path: "/health",
    responses: {
      200: jsonResponse(
        "어드민 API가 요청을 처리할 준비가 됐습니다.",
        adminReadinessResponseSchema
      ),
      503: jsonResponse(
        "API 데이터베이스가 준비되지 않았습니다.",
        adminReadinessResponseSchema
      ),
    },
    summary: "어드민 API readiness 조회",
  })
  app.openapi(readinessRoute, (context) => {
    const ready = input.health.isDatabaseReady()
    return context.json(
      {
        checks: { database: ready ? "ready" : "unavailable" },
        impact: ready ? "none" : "database-dependent-requests-unavailable",
        ok: ready,
        service: "api",
      },
      ready ? 200 : 503
    )
  })

  const livenessRoute = createRoute({
    method: "get",
    operationId: "getAdminLiveness",
    path: "/health/live",
    responses: {
      200: jsonResponse(
        "API process가 실행 중입니다.",
        adminHealthResponseSchema
      ),
    },
    summary: "어드민 API liveness 조회",
  })
  app.openapi(livenessRoute, (context) =>
    context.json({ ok: true, service: "api" }, 200)
  )

  const sessionRoute = createRoute({
    method: "get",
    operationId: "getAdminSession",
    path: "/session",
    responses: adminAuthenticatedResponses(
      jsonResponse("현재 어드민 세션입니다.", adminSessionDtoSchema)
    ),
    summary: "현재 어드민 세션 조회",
    ...adminSessionRouteOptions(input.sessionResolver),
  })
  app.openapi(sessionRoute, (context) => {
    const session = context.var.activeAdminSession
    return context.json(
      adminSessionDtoSchema.parse({
        admin: {
          email: session.admin.email,
          id: session.admin.id,
          name: session.admin.name,
        },
      }),
      200
    )
  })
}
