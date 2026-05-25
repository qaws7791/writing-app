import { Hono } from "hono"
import { cors } from "hono/cors"

import type { ContentService } from "@workspace/core/content"

import { registerCoursesRoutes } from "@/routes/courses.route"
import { registerHealthRoute } from "@/routes/health.route"
import { registerLessonsRoutes } from "@/routes/lessons.route"
import { registerOpenApiRoute } from "@/routes/openapi.route"

export interface ApiAppDependencies {
  checkDatabase(): Promise<boolean>
  contentService: ContentService
  corsOrigins?: string[]
}

export function createApiApp(dependencies: ApiAppDependencies) {
  const app = new Hono()

  app.use(
    "*",
    cors({
      origin: dependencies.corsOrigins ?? [
        "http://localhost:3000",
        "http://localhost:3001",
      ],
    })
  )

  registerHealthRoute(app, dependencies)
  registerCoursesRoutes(app, dependencies)
  registerLessonsRoutes(app, dependencies)
  registerOpenApiRoute(app)

  return app
}
