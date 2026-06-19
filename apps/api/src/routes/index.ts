import type { OpenAPIHono } from "@hono/zod-openapi"

import type { ApiDependencies } from "@/context/create-request-context"
import { createOpenApiDocument } from "@/http/openapi"
import { aiFeedbackRoute } from "@/modules/ai-feedback/ai-feedback.routes"
import { authSessionRoute } from "@/modules/auth/auth.routes"
import { registerAuthProxy } from "@/modules/auth/auth-proxy"
import {
  getCourseDetailRoute,
  listCoursesRoute,
} from "@/modules/courses/courses.routes"
import { healthRoute } from "@/modules/health/health.routes"
import { getLessonRoute } from "@/modules/lessons/lessons.routes"
import {
  completeLessonRoute,
  saveAnswerRoute,
} from "@/modules/learning/learning.routes"
import { profileRoute } from "@/modules/profile/profile.routes"
import { progressRoute } from "@/modules/progress/progress.routes"

export const routes = [
  healthRoute,
  authSessionRoute,
  profileRoute,
  listCoursesRoute,
  getCourseDetailRoute,
  getLessonRoute,
  progressRoute,
  saveAnswerRoute,
  completeLessonRoute,
  aiFeedbackRoute,
] as const

export function registerApiBootstrapRoutes(
  app: OpenAPIHono,
  dependencies: Pick<ApiDependencies, "authHandler">
): void {
  registerAuthProxy(app, dependencies.authHandler)
  app.get("/openapi", (context) => context.json(createOpenApiDocument(app)))
}
