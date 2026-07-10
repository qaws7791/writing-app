import { adminSessionDtoSchema } from "@workspace/contracts/admin"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute } from "@/context/hono-env"
import { adminAuthenticatedResponses, jsonResponse } from "@/http/openapi"
import { adminSessionRouteOptions } from "@/routes/admin-route-options"

export function createSessionRoute(sessionResolver: AdminSessionResolver) {
  return defineAdminRoute({
    method: "get",
    operationId: "getAdminSession",
    path: "/session",
    responses: adminAuthenticatedResponses(
      jsonResponse("현재 어드민 세션입니다.", adminSessionDtoSchema)
    ),
    summary: "현재 어드민 세션 조회",
    handler: (context) => context.json(context.var.activeAdminSession, 200),
    ...adminSessionRouteOptions(sessionResolver),
  })
}
