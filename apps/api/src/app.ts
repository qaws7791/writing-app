import { Hono, type Context } from "hono"
import { cors } from "hono/cors"
import { z } from "zod"

import type { SessionResolver } from "@/auth/session"
import { createAiFeedbackRoute } from "@/routes/ai-feedback.route"
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
import { errorResponse } from "@/routes/error-response"
import type { ContentRepository } from "@workspace/core/content"
import type { AiFeedbackService } from "@workspace/core/ai-feedback"
import type { LearningService } from "@workspace/core/learning"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import {
  createRequestLoggingMiddleware,
  type RequestLogger,
} from "@workspace/logger"

export type ApiDependencies = {
  readonly aiFeedbackService?: AiFeedbackService
  readonly authHandler?: (request: Request) => Promise<Response>
  readonly contentRepository?: ContentRepository
  readonly learningService?: LearningService
  readonly now?: () => Date
  readonly profileReader: ProfileReader
  readonly progressReader?: ProgressReader
  readonly requestLogger?: RequestLogger
  readonly sessionResolver: SessionResolver
  readonly webOrigin?: string
}

export function createApp(dependencies: ApiDependencies): Hono {
  const app = new Hono()

  app.onError(handleAppError)
  app.use("*", async (context, next) => {
    try {
      await next()
    } catch (error) {
      return handleAppError(error, context)
    }
  })

  if (dependencies.requestLogger !== undefined) {
    app.use(
      "*",
      createRequestLoggingMiddleware({
        logRequest: dependencies.requestLogger,
      })
    )
  }

  app.use(
    "*",
    cors({
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      origin: dependencies.webOrigin ?? localRuntimeDefaults.learnerWebOrigin,
    })
  )

  app.route("/health", createHealthRoute())
  app.route("/openapi", createOpenApiRoute())
  if (dependencies.authHandler !== undefined) {
    const authHandler = dependencies.authHandler

    app.get("/api/auth/sign-in/google", async (context) => {
      return redirectGoogleSignIn(context.req.raw, authHandler)
    })
    app.on(["GET", "POST"], "/api/auth/*", (context) => {
      return authHandler(context.req.raw)
    })
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

async function redirectGoogleSignIn(
  request: Request,
  authHandler: (request: Request) => Promise<Response>
): Promise<Response> {
  const url = new URL(request.url)
  const signInUrl = new URL("/api/auth/sign-in/social", url)
  const response = await authHandler(
    new Request(signInUrl, {
      body: JSON.stringify({
        callbackURL: url.searchParams.get("callbackURL") ?? undefined,
        provider: "google",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
  )

  if (!response.ok) {
    return response
  }

  const body = (await response.json()) as { readonly url?: unknown }

  if (typeof body.url !== "string") {
    return response
  }

  return Response.redirect(body.url, 302)
}

function handleAppError(error: unknown, context: Context) {
  if (error instanceof z.ZodError) {
    return context.json(errorResponse("invalid_request"), 400)
  }

  return context.json(errorResponse("internal_server_error"), 500)
}
