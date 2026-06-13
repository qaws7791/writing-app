import { Hono } from "hono"
import { cors } from "hono/cors"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { createDashboardRoute } from "@/routes/dashboard.route"
import { createHealthRoute } from "@/routes/health.route"
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

  return app
}
