import { Hono } from "hono"
import { cors } from "hono/cors"

import type { ContentService } from "@workspace/core/content"
import { createRequestLogFields } from "@workspace/logger"

import type { AuthRuntime } from "@/auth/session"
import { registerAuthRoute } from "@/routes/auth.route"
import { registerCoursesRoutes } from "@/routes/courses.route"
import { registerHealthRoute } from "@/routes/health.route"
import { registerLessonsRoutes } from "@/routes/lessons.route"
import { registerMeRoute } from "@/routes/me.route"
import { registerOpenApiRoute } from "@/routes/openapi.route"

export interface ApiLogger {
  error(fields: object, message: string): void
  info(fields: object, message: string): void
}

export interface ApiAppDependencies {
  auth: AuthRuntime
  checkDatabase(): Promise<boolean>
  contentService: ContentService
  corsOrigins?: string[]
  logger: ApiLogger
}

export function createApiApp(dependencies: ApiAppDependencies) {
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
        "API request failed"
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
        "API request completed"
      )
    }
  })

  app.use(
    "*",
    cors({
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
      credentials: true,
      origin: dependencies.corsOrigins ?? [
        "http://localhost:3000",
        "http://localhost:3001",
      ],
    })
  )

  registerAuthRoute(app, dependencies.auth)
  registerHealthRoute(app, dependencies)
  registerCoursesRoutes(app, dependencies)
  registerLessonsRoutes(app, dependencies)
  registerMeRoute(app, dependencies.auth)
  registerOpenApiRoute(app)

  return app
}
