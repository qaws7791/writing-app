import { adminSessionDtoSchema } from "@workspace/contracts/identity/admin-session"

import type { AdminSessionResolver } from "@workspace/identity/sessions"
import { defineAdminRoute } from "@/admin/admin-hono-env"
import {
  adminAuthenticatedResponses,
  adminHealthResponseSchema,
  jsonResponse,
} from "@/admin/admin-openapi"
import { adminSessionRouteOptions } from "@workspace/identity/http"
import type { ApiHealthProbe } from "@/runtime/api-health"

export function createAdminHealthRoutes(health: ApiHealthProbe) {
  return [
    defineAdminRoute({
      method: "get",
      operationId: "getAdminHealth",
      path: "/health",
      responses: {
        200: jsonResponse(
          "어드민 API가 요청을 처리할 준비가 됐습니다.",
          adminHealthResponseSchema
        ),
        503: jsonResponse(
          "API 데이터베이스가 준비되지 않았습니다.",
          adminHealthResponseSchema
        ),
      },
      summary: "어드민 API readiness 조회",
      handler: (context) => {
        const ready = health.isDatabaseReady()
        return context.json({ ok: ready, service: "api" }, ready ? 200 : 503)
      },
    }),
    defineAdminRoute({
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
      handler: (context) => context.json({ ok: true, service: "api" }, 200),
    }),
  ] as const
}

export function createAdminSessionRoute(sessionResolver: AdminSessionResolver) {
  return defineAdminRoute({
    method: "get",
    operationId: "getAdminSession",
    path: "/session",
    responses: adminAuthenticatedResponses(
      jsonResponse("현재 어드민 세션입니다.", adminSessionDtoSchema)
    ),
    summary: "현재 어드민 세션 조회",
    handler: (context) => {
      const session = context.var.activeAdminSession

      return context.json(
        {
          admin: {
            email: session.admin.email,
            id: session.admin.id,
            name: session.admin.name,
            role: session.admin.role,
          },
        },
        200
      )
    },
    ...adminSessionRouteOptions(sessionResolver),
  })
}
