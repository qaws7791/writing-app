import { Hono } from "hono"
import { cors } from "hono/cors"

import type { AdminService } from "@workspace/core/admin"
import { createRequestLogFields } from "@workspace/logger"

import type { AdminAuthRuntime } from "@/auth/admin-session"
import { registerAuthRoute } from "@/routes/auth.route"
import { registerCoursesRoute } from "@/routes/courses.route"
import { registerCurriculumVersionsRoute } from "@/routes/curriculum-versions.route"
import { registerHealthRoute } from "@/routes/health.route"
import { registerOpenApiRoute } from "@/routes/openapi.route"
import { registerUsersRoute } from "@/routes/users.route"

export interface AdminApiLogger {
  error(fields: object, message: string): void
  info(fields: object, message: string): void
}

export interface AdminApiAppDependencies {
  adminService: AdminService
  auth: AdminAuthRuntime
  checkDatabase(): Promise<boolean>
  corsOrigins?: string[]
  logger: AdminApiLogger
}

export function createAdminApiApp(dependencies: AdminApiAppDependencies) {
  const app = new Hono()

  app.use("*", async (context, next) => {
    const requestId = context.req.header("x-request-id") ?? crypto.randomUUID()
    const startedAt = performance.now()
    let status = 500

    context.header("x-request-id", requestId)

    try {
      await next()
      status = context.res.status
    } catch (error) {
      dependencies.logger.error(
        {
          error,
          requestId,
        },
        "Admin API request failed"
      )
      throw error
    } finally {
      dependencies.logger.info(
        createRequestLogFields({
          durationMs: Math.round(performance.now() - startedAt),
          method: context.req.method,
          path: new URL(context.req.url).pathname,
          requestId,
          status,
        }),
        "Admin API request completed"
      )
    }
  })

  app.use(
    "*",
    cors({
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
      credentials: true,
      origin: dependencies.corsOrigins ?? ["http://localhost:3001"],
    })
  )

  registerAuthRoute(app, dependencies.auth)
  registerCoursesRoute(app, dependencies)
  registerCurriculumVersionsRoute(app, dependencies)
  registerHealthRoute(app, dependencies)
  registerUsersRoute(app, dependencies)
  registerOpenApiRoute(app)

  return app
}
