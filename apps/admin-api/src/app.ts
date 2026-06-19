import type { MiddlewareHandler } from "hono"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { createApp as createHonoApp } from "@workspace/hono/core"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { createOpenApiDocument } from "@/http/openapi"
import { createAnalyticsRoutes } from "@/routes/analytics.route"
import { createCoursesRoutes } from "@/routes/courses.route"
import { createCurriculumEditorRoutes } from "@/routes/curriculum-editor.route"
import { createDashboardRoutes } from "@/routes/dashboard.route"
import { healthRoute } from "@/routes/health.route"
import { createSettingsRoutes } from "@/routes/settings.route"
import { createUsersRoutes } from "@/routes/users.route"
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

export function createApp(dependencies: AdminApiDependencies): OpenAPIHono {
  const now = dependencies.now ?? (() => new Date())
  const app = createHonoApp({
    middleware: createMiddleware(dependencies),
    routes: [
      healthRoute,
      ...createDashboardRoutes({
        dashboardService: dependencies.dashboardService,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createAnalyticsRoutes({
        adminService: dependencies.dashboardService,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createCoursesRoutes({
        adminService: dependencies.dashboardService,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createCurriculumEditorRoutes({
        adminService: dependencies.dashboardService,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createUsersRoutes({
        adminService: dependencies.dashboardService,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createSettingsRoutes({
        adminService: dependencies.dashboardService,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
    ] as const,
  })

  if (dependencies.authHandler !== undefined) {
    const authHandler = dependencies.authHandler

    app.on(["GET", "POST"], "/api/auth/*", (context) => {
      return authHandler(context.req.raw)
    })
  }

  app.get("/openapi", (context) => context.json(createOpenApiDocument(app)))

  return app
}

function createMiddleware(
  dependencies: AdminApiDependencies
): readonly MiddlewareHandler[] {
  const middleware: MiddlewareHandler[] = []

  if (dependencies.requestLogger !== undefined) {
    middleware.push(
      createRequestLoggingMiddleware({
        createRequestId: dependencies.requestLoggingRuntime?.createRequestId,
        logRequest: dependencies.requestLogger,
        readMonotonicTimeMs:
          dependencies.requestLoggingRuntime?.readMonotonicTimeMs,
      })
    )
  }

  middleware.push(
    cors({
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      origin: dependencies.adminOrigin ?? localRuntimeDefaults.adminWebOrigin,
    })
  )

  return middleware
}
