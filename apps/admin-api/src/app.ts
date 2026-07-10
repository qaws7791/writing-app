import type { MiddlewareHandler } from "hono"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { createApp as createHonoApp } from "@workspace/hono/core"
import {
  createRequestBodyLimitMiddleware,
  createTrustedOriginMiddleware,
} from "@workspace/hono/security"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { createOpenApiDocument } from "@/http/openapi"
import { createAiChatRoutes } from "@/routes/ai-chat.route"
import { createAnalyticsRoutes } from "@/routes/analytics.route"
import { createCoursesRoutes } from "@/routes/courses.route"
import { createCurriculumEditorRoutes } from "@/routes/curriculum-editor.route"
import { createDashboardRoutes } from "@/routes/dashboard.route"
import { healthRoute } from "@/routes/health.route"
import { createResourceDocumentsRoutes } from "@/routes/resource-documents.route"
import { createResourceSearchRoutes } from "@/routes/resource-search.route"
import { createResourceTreeRoutes } from "@/routes/resource-tree.route"
import { createResourcesRoutes } from "@/routes/resources.route"
import { createSettingsRoutes } from "@/routes/settings.route"
import { createSessionRoute } from "@/routes/session.route"
import { createUsersRoutes } from "@/routes/users.route"
import type {
  AdminAiChatUseCase,
  AdminAnalyticsUseCase,
  AdminContentResetUseCase,
  AdminCourseUseCase,
  AdminDashboardUseCase,
  AdminResourceUseCase,
  AdminSettingsUseCase,
  AdminUserUseCase,
} from "@workspace/core/admin"
import type {
  ResourceDocumentUseCase,
  ResourceSearchUseCase,
  ResourceTreeUseCase,
} from "@workspace/core/modules/resource-library/api"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import {
  createRequestLoggingMiddleware,
  type RequestLogger,
  type RequestLoggingRuntime,
} from "@workspace/logger"
import type { AdminAiChatAgent } from "@/mastra/admin-content-agent"

export type AdminApiServices = {
  readonly aiChat: AdminAiChatUseCase
  readonly analytics: AdminAnalyticsUseCase
  readonly contentReset: AdminContentResetUseCase
  readonly courses: AdminCourseUseCase
  readonly dashboard: AdminDashboardUseCase
  readonly resourceLibrary: {
    readonly documents: ResourceDocumentUseCase
    readonly search: ResourceSearchUseCase
    readonly tree: ResourceTreeUseCase
  }
  readonly resources: AdminResourceUseCase
  readonly settings: AdminSettingsUseCase
  readonly users: AdminUserUseCase
}

export type AdminApiDependencies = {
  readonly aiChatAgent?: AdminAiChatAgent
  readonly adminServices: AdminApiServices
  readonly adminOrigin?: string
  readonly authHandler?: (request: Request) => Promise<Response>
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
      createSessionRoute(dependencies.sessionResolver),
      ...createAiChatRoutes({
        aiChatAgent: dependencies.aiChatAgent,
        aiChatService: dependencies.adminServices.aiChat,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createDashboardRoutes({
        dashboardService: dependencies.adminServices.dashboard,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createAnalyticsRoutes({
        analyticsService: dependencies.adminServices.analytics,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createCoursesRoutes({
        courseService: dependencies.adminServices.courses,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createCurriculumEditorRoutes({
        courseService: dependencies.adminServices.courses,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createUsersRoutes({
        userService: dependencies.adminServices.users,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createResourceTreeRoutes({
        now,
        sessionResolver: dependencies.sessionResolver,
        treeService: dependencies.adminServices.resourceLibrary.tree,
      }),
      ...createResourceDocumentsRoutes({
        documentService: dependencies.adminServices.resourceLibrary.documents,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createResourceSearchRoutes({
        searchService: dependencies.adminServices.resourceLibrary.search,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createResourcesRoutes({
        now,
        resourceService: dependencies.adminServices.resources,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createSettingsRoutes({
        contentResetService: dependencies.adminServices.contentReset,
        now,
        settingsService: dependencies.adminServices.settings,
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

  const adminOrigin =
    dependencies.adminOrigin ?? localRuntimeDefaults.adminWebOrigin

  middleware.push(
    cors({
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      origin: adminOrigin,
    }),
    createRequestBodyLimitMiddleware(),
    createTrustedOriginMiddleware({ trustedOrigin: adminOrigin })
  )

  return middleware
}
