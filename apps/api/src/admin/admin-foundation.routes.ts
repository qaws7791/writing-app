import { adminSessionDtoSchema } from "@workspace/contracts/identity/admin-session"

import type { AdminSessionResolver } from "@workspace/auth/admin/server"
import { defineAdminRoute } from "@/admin/admin-hono-env"
import {
  adminAuthenticatedResponses,
  adminHealthResponseSchema,
  jsonResponse,
} from "@/admin/admin-openapi"
import { adminSessionRouteOptions } from "@/admin/admin-route-options"

export const adminHealthRoute = defineAdminRoute({
  method: "get",
  operationId: "getAdminHealth",
  path: "/health",
  responses: {
    200: jsonResponse("어드민 API 상태입니다.", adminHealthResponseSchema),
  },
  summary: "어드민 API 상태 조회",
  handler: (context) =>
    context.json(
      {
        ok: true,
        service: "api",
      },
      200
    ),
})

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
