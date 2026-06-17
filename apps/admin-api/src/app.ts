import { Hono } from "hono"
import { cors } from "hono/cors"
import { ZodError } from "zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { createAnalyticsRoute } from "@/routes/analytics.route"
import { createCoursesRoute } from "@/routes/courses.route"
import { createCurriculumEditorRoute } from "@/routes/curriculum-editor.route"
import { createDashboardRoute } from "@/routes/dashboard.route"
import { errorResponse } from "@/routes/error-response"
import { createHealthRoute } from "@/routes/health.route"
import { createSettingsRoute } from "@/routes/settings.route"
import { createUsersRoute } from "@/routes/users.route"
import type { AdminService } from "@workspace/core/admin"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import {
  createRequestLoggingMiddleware,
  type RequestLogger,
  type RequestLoggingRuntime,
} from "@workspace/logger"

export type AdminApiDependencies = {
  readonly adminOrigin?: string
  readonly authHandler?: (request: Request) => Promise<Response>
  readonly dashboardService: AdminService
  readonly now?: () => Date
  readonly requestLogger?: RequestLogger
  readonly requestLoggingRuntime?: RequestLoggingRuntime
  readonly sessionResolver: AdminSessionResolver
}

export function createApp(dependencies: AdminApiDependencies): Hono {
  const app = new Hono()

  app.onError((error, context) => {
    if (error instanceof ZodError) {
      return context.json(errorResponse("invalid_request"), 400)
    }

    return context.json(errorResponse("internal_error"), 500)
  })

  if (dependencies.requestLogger !== undefined) {
    app.use(
      "*",
      createRequestLoggingMiddleware({
        createRequestId: dependencies.requestLoggingRuntime?.createRequestId,
        logRequest: dependencies.requestLogger,
        readMonotonicTimeMs:
          dependencies.requestLoggingRuntime?.readMonotonicTimeMs,
      })
    )
  }

  app.use(
    "*",
    cors({
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      origin: dependencies.adminOrigin ?? localRuntimeDefaults.adminWebOrigin,
    })
  )

  app.route("/health", createHealthRoute())
  if (dependencies.authHandler !== undefined) {
    const authHandler = dependencies.authHandler

    app.on(["GET", "POST"], "/api/auth/*", (context) => {
      return authHandler(context.req.raw)
    })
  }
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
    "/courses",
    createCoursesRoute({
      adminService: dependencies.dashboardService,
      now: dependencies.now ?? (() => new Date()),
      sessionResolver: dependencies.sessionResolver,
    })
  )
  app.route(
    "/courses",
    createCurriculumEditorRoute({
      adminService: dependencies.dashboardService,
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
