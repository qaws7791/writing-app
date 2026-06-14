import { Hono } from "hono"
import { cors } from "hono/cors"

import type { SessionResolver } from "@/auth/session"
import { createAiFeedbackRoute } from "@/routes/ai-feedback.route"
import { createAuthRoute } from "@/routes/auth.route"
import { createCoursesRoute } from "@/routes/courses.route"
import { createHealthRoute } from "@/routes/health.route"
import {
  createGoogleOAuthRoute,
  type GoogleOAuthRouteOptions,
} from "@/routes/google-oauth.route"
import { createLearningRoute } from "@/routes/learning.route"
import { createLessonsRoute } from "@/routes/lessons.route"
import { createOpenApiRoute } from "@/routes/openapi.route"
import { createProfileRoute, type ProfileReader } from "@/routes/profile.route"
import {
  createProgressRoute,
  type ProgressReader,
} from "@/routes/progress.route"
import type { ContentRepository } from "@workspace/core/content"
import type { AiFeedbackService } from "@workspace/core/ai-feedback"
import type { LearningService } from "@workspace/core/learning"

export type ApiDependencies = {
  readonly aiFeedbackService?: AiFeedbackService
  readonly contentRepository?: ContentRepository
  readonly googleOAuth?: GoogleOAuthRouteOptions
  readonly learningService?: LearningService
  readonly now?: () => Date
  readonly profileReader: ProfileReader
  readonly progressReader?: ProgressReader
  readonly sessionResolver: SessionResolver
  readonly webOrigin?: string
}

export function createApp(dependencies: ApiDependencies): Hono {
  const app = new Hono()

  app.use(
    "*",
    cors({
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      origin: dependencies.webOrigin ?? "http://localhost:3000",
    })
  )

  app.route("/health", createHealthRoute())
  app.route("/openapi", createOpenApiRoute())
  if (dependencies.googleOAuth !== undefined) {
    app.route("/api/auth", createGoogleOAuthRoute(dependencies.googleOAuth))
  }
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

  if (dependencies.aiFeedbackService !== undefined) {
    app.route(
      "/ai-feedback",
      createAiFeedbackRoute({
        aiFeedbackService: dependencies.aiFeedbackService,
        now: dependencies.now ?? (() => new Date()),
        sessionResolver: dependencies.sessionResolver,
      })
    )
  }

  return app
}
