import { Hono } from "hono"

import type { SessionResolver } from "@/auth/session"
import { createAuthRoute } from "@/routes/auth.route"
import { createCoursesRoute } from "@/routes/courses.route"
import { createHealthRoute } from "@/routes/health.route"
import { createLearningRoute } from "@/routes/learning.route"
import { createLessonsRoute } from "@/routes/lessons.route"
import { createOpenApiRoute } from "@/routes/openapi.route"
import { createProfileRoute, type ProfileReader } from "@/routes/profile.route"
import {
  createProgressRoute,
  type ProgressReader,
} from "@/routes/progress.route"
import type { ContentRepository } from "@workspace/core/content"
import type { LearningService } from "@workspace/core/learning"

export type ApiDependencies = {
  readonly contentRepository?: ContentRepository
  readonly learningService?: LearningService
  readonly now?: () => Date
  readonly profileReader: ProfileReader
  readonly progressReader?: ProgressReader
  readonly sessionResolver: SessionResolver
}

export function createApp(dependencies: ApiDependencies): Hono {
  const app = new Hono()

  app.route("/health", createHealthRoute())
  app.route("/openapi", createOpenApiRoute())
  app.route("/auth", createAuthRoute(dependencies.sessionResolver))
  app.route("/profile", createProfileRoute(dependencies))

  if (dependencies.contentRepository !== undefined) {
    app.route(
      "/courses",
      createCoursesRoute({
        contentRepository: dependencies.contentRepository,
        sessionResolver: dependencies.sessionResolver,
      })
    )
    app.route(
      "/lessons",
      createLessonsRoute({
        contentRepository: dependencies.contentRepository,
        sessionResolver: dependencies.sessionResolver,
      })
    )
  }

  if (
    dependencies.contentRepository !== undefined &&
    dependencies.progressReader !== undefined
  ) {
    app.route(
      "/progress",
      createProgressRoute({
        contentRepository: dependencies.contentRepository,
        progressReader: dependencies.progressReader,
        sessionResolver: dependencies.sessionResolver,
      })
    )
  }

  if (dependencies.learningService !== undefined) {
    app.route(
      "/learning",
      createLearningRoute({
        learningService: dependencies.learningService,
        now: dependencies.now ?? (() => new Date()),
        sessionResolver: dependencies.sessionResolver,
      })
    )
  }

  return app
}
