import { Hono } from "hono"
import { cors } from "hono/cors"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { createAnalyticsRoute } from "@/routes/analytics.route"
import { createDashboardRoute } from "@/routes/dashboard.route"
import { createHealthRoute } from "@/routes/health.route"
import { createSettingsRoute } from "@/routes/settings.route"
import { createUsersRoute } from "@/routes/users.route"
import type { AdminService } from "@workspace/core/admin"

export type AdminApiDependencies = {
  readonly adminOrigin?: string
  readonly dashboardService: AdminService
  readonly now?: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createApp(dependencies: AdminApiDependencies): Hono {
  const app = new Hono()

  app.use(
    "*",
    cors({
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      origin: dependencies.adminOrigin ?? "http://localhost:3003",
    })
  )

  app.route("/health", createHealthRoute())
  app.route(
    "/dashboard",
    createDashboardRoute({
      dashboardService: dependencies.dashboardService,
      now: dependencies.now ?? (() => new Date()),
      sessionResolver: dependencies.sessionResolver,
    })
  )
  app.route(
    "/analytics",
    createAnalyticsRoute({
      adminService: dependencies.dashboardService,
      now: dependencies.now ?? (() => new Date()),
      sessionResolver: dependencies.sessionResolver,
    })
  )
  app.route(
    "/users",
    createUsersRoute({
      adminService: dependencies.dashboardService,
      now: dependencies.now ?? (() => new Date()),
      sessionResolver: dependencies.sessionResolver,
    })
  )
  app.route(
    "/settings",
    createSettingsRoute({
      adminService: dependencies.dashboardService,
      now: dependencies.now ?? (() => new Date()),
      sessionResolver: dependencies.sessionResolver,
    })
  )

  return app
}
