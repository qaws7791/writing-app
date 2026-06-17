import type { Context } from "hono"
import { cors } from "hono/cors"
import { z } from "zod"

import type { SessionResolver } from "@workspace/core/auth"
import { createAuthSessionRoute } from "@/routes/auth/session.route"
import { createAiFeedbackRoute } from "@/routes/ai-feedback.route"
import { createGetCourseDetailRoute } from "@/routes/courses/get-course-detail.route"
import { createListCoursesRoute } from "@/routes/courses/list-courses.route"
import { createHealthRoute } from "@/routes/health.route"
import { createCompleteLessonRoute } from "@/routes/learning/complete-lesson.route"
import { createSaveAnswerRoute } from "@/routes/learning/save-answer.route"
import { createGetLessonRoute } from "@/routes/lessons/get-lesson.route"
import { createProfileRoute } from "@/routes/profile.route"
import { createProgressRoute } from "@/routes/progress.route"
import { createOpenApiApp } from "@/lib/hono"
import { errorResponse } from "@/lib/error-response"
import type { LearnerContentService } from "@workspace/core/content"
import type { AiFeedbackService } from "@workspace/core/ai-feedback"
import type {
  LearningService,
  ProfileReader,
  ProgressService,
} from "@workspace/core/learning"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import {
  createRequestLoggingMiddleware,
  type RequestLogger,
  type RequestLoggingRuntime,
} from "@workspace/logger"
import type { OpenAPIHono } from "@hono/zod-openapi"

export type ApiDependencies = {
  readonly aiFeedbackService?: AiFeedbackService
  readonly authHandler?: (request: Request) => Promise<Response>
  readonly contentService?: LearnerContentService
  readonly learningService?: LearningService
  readonly now?: () => Date
  readonly profileReader: ProfileReader
  readonly progressService?: ProgressService
  readonly requestLogger?: RequestLogger
  readonly requestLoggingRuntime?: RequestLoggingRuntime
  readonly sessionResolver: SessionResolver
  readonly webOrigin?: string
}

export const openApiDocumentConfig = {
  info: {
    title: "Writing App API",
    version: "0.0.1",
  },
  openapi: "3.1.0",
} as const

const bearerAuthSecurityScheme = {
  scheme: "bearer",
  type: "http",
} as const

export type ApiOpenApiDocument = {
  readonly components: {
    readonly securitySchemes: {
      readonly bearerAuth: typeof bearerAuthSecurityScheme
    }
  }
  readonly info: {
    readonly title: string
    readonly version: string
  }
  readonly openapi: string
  readonly paths?: unknown
}

export function createApp(dependencies: ApiDependencies): OpenAPIHono {
  const app = createOpenApiApp()

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
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      origin: dependencies.webOrigin ?? localRuntimeDefaults.learnerWebOrigin,
    })
  )

  app.route("/health", createHealthRoute())
  if (dependencies.authHandler !== undefined) {
    const authHandler = dependencies.authHandler

    app.get("/api/auth/sign-in/google", async (context) => {
      return redirectGoogleSignIn(context.req.raw, authHandler)
    })
    app.on(["GET", "POST"], "/api/auth/*", (context) => {
      return authHandler(context.req.raw)
    })
  }
  app.route("/auth", createAuthSessionRoute(dependencies.sessionResolver))
  app.route("/profile", createProfileRoute(dependencies))

  if (dependencies.contentService !== undefined) {
    const contentRouteDependencies = {
      contentService: dependencies.contentService,
      sessionResolver: dependencies.sessionResolver,
    }

    app.route("/courses", createListCoursesRoute(contentRouteDependencies))
    app.route("/courses", createGetCourseDetailRoute(contentRouteDependencies))
    app.route("/lessons", createGetLessonRoute(contentRouteDependencies))
  }

  if (dependencies.progressService !== undefined) {
    app.route(
      "/progress",
      createProgressRoute({
        progressService: dependencies.progressService,
        sessionResolver: dependencies.sessionResolver,
      })
    )
  }

  if (dependencies.learningService !== undefined) {
    const learningRouteDependencies = {
      learningService: dependencies.learningService,
      now: dependencies.now ?? (() => new Date()),
      sessionResolver: dependencies.sessionResolver,
    }

    app.route("/learning", createSaveAnswerRoute(learningRouteDependencies))
    app.route("/learning", createCompleteLessonRoute(learningRouteDependencies))
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

  app.get("/openapi", (context) => context.json(createOpenApiDocument(app)))

  return app
}

export function createOpenApiDocument(app: OpenAPIHono): ApiOpenApiDocument {
  const document = app.getOpenAPI31Document(openApiDocumentConfig)

  return {
    ...document,
    components: {
      ...document.components,
      securitySchemes: {
        ...document.components?.securitySchemes,
        bearerAuth: bearerAuthSecurityScheme,
      },
    },
  }
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
