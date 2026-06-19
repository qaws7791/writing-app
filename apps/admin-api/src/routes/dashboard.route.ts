import type { AnyRouteConfig } from "@workspace/hono/core"
import { adminDashboardDtoSchema } from "@workspace/contracts/admin"
import type { AdminService } from "@workspace/core/admin"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import { adminAuthenticatedResponses, jsonResponse } from "@/http/openapi"
import { adminSessionRouteOptions } from "@/routes/admin-route-options"

export type DashboardRouteDependencies = {
  readonly dashboardService: AdminService
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createDashboardRoutes(
  dependencies: DashboardRouteDependencies
) {
  return [createGetDashboardRoute(dependencies)] as const
}

function createGetDashboardRoute({
  dashboardService,
  now,
  sessionResolver,
}: DashboardRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminDashboard",
    path: "/dashboard",
    responses: adminAuthenticatedResponses(
      jsonResponse("어드민 대시보드입니다.", adminDashboardDtoSchema)
    ),
    summary: "어드민 대시보드 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) =>
    context.json(
      await dashboardService.getDashboard({
        now: now(),
      }),
      200
    )

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}
