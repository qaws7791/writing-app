import type { OpenAPIHono } from "@hono/zod-openapi"

import type { ApiDependencies } from "@/context/create-request-context"
import { createOpenApiDocument } from "@/http/openapi"
import { registerAuthProxy } from "@/modules/auth/auth-proxy"
import {
  getCourseDetailRoute,
  listCourseCategoriesRoute,
  listCoursesRoute,
} from "@/modules/courses/courses.routes"
import { healthRoute } from "@/modules/health/health.routes"
import { getLessonRoute } from "@/modules/lessons/lessons.routes"
import {
  completeStepRoute,
  startLessonRoute,
} from "@/modules/learning/learner-transition.routes"
import { progressRoute } from "@/modules/progress/progress.routes"

export const routes = [
  healthRoute,
  listCoursesRoute,
  listCourseCategoriesRoute,
  getCourseDetailRoute,
  getLessonRoute,
  progressRoute,
  startLessonRoute,
  completeStepRoute,
] as const

export function registerApiBootstrapRoutes(
  app: OpenAPIHono,
  dependencies: Pick<ApiDependencies, "authHandler">
): void {
  registerAuthProxy(app, dependencies.authHandler)
  app.get("/openapi", (context) => context.json(createOpenApiDocument(app)))
}
