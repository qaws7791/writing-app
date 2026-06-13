import { Hono } from "hono"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { errorResponse } from "@/routes/error-response"
import { resolveAdminSession } from "@/routes/route-helpers"
import type { AdminService } from "@workspace/core/admin"

export type DashboardRouteDependencies = {
  readonly dashboardService: AdminService
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createDashboardRoute({
  dashboardService,
  now,
  sessionResolver,
}: DashboardRouteDependencies): Hono {
  const route = new Hono()

  route.get("/", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    return context.json(
      await dashboardService.getDashboard({
        now: now(),
      })
    )
  })

  return route
}
