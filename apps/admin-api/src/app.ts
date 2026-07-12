import type { MiddlewareHandler } from "hono"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { createApp as createHonoApp } from "@workspace/hono/core"
import type { InternalErrorLogger } from "@workspace/hono/errors"
import {
  createRequestBodyLimitMiddleware,
  createTrustedOriginMiddleware,
  withPrivateNoStore,
} from "@workspace/hono/security"

import type { AdminSessionResolver } from "@/auth/admin-session"
import type { AdminMfaRecoveryService } from "@/auth/admin-mfa-recovery"
import type { ResourceEventsWorkspace } from "@/collaboration/resource-events-hub"
import { createOpenApiDocument } from "@/http/openapi"
import type { ResourceDocumentOperationCoordinator } from "@/resource-library/resource-document-operation-coordinator"
import { createAiChatRoutes } from "@/routes/ai-chat.route"
import {
  createAiChatRequestGuard,
  type AiChatRequestGuard,
} from "@/routes/ai-chat-request-guard"
import { createAnalyticsRoutes } from "@/routes/analytics.route"
import { createAdminMfaRoutes } from "@/routes/admin-mfa.route"
import { createCoursesRoutes } from "@/routes/courses.route"
import { createCurriculumEditorRoutes } from "@/routes/curriculum-editor.route"
import { createDashboardRoutes } from "@/routes/dashboard.route"
import { healthRoute } from "@/routes/health.route"
import { createResourceDocumentsRoutes } from "@/routes/resource-documents.route"
import { createResourceDocumentSyncRoutes } from "@/routes/resource-document-sync.route"
import { createResourceSearchRoutes } from "@/routes/resource-search.route"
import { createResourceTreeRoutes } from "@/routes/resource-tree.route"
import { createSettingsRoutes } from "@/routes/settings.route"
import { createSessionRoute } from "@/routes/session.route"
import { createUsersRoutes } from "@/routes/users.route"
import type {
  AdminAiChatUseCase,
  AdminAnalyticsUseCase,
  AdminContentResetUseCase,
  AdminCourseUseCase,
  AdminDashboardUseCase,
  AdminSettingsUseCase,
  AdminUserUseCase,
} from "@workspace/core/admin"
import type {
  ResourceDocumentUseCase,
  ResourceDocumentSyncUseCase,
  ResourceSearchUseCase,
  ResourceTreeUseCase,
} from "@workspace/core/resource-library"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import {
  createRequestLoggingMiddleware,
  type RequestLogger,
  type RequestLoggingRuntime,
  type SecurityAuditLogger,
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
    readonly sync: ResourceDocumentSyncUseCase
    readonly search: ResourceSearchUseCase
    readonly tree: ResourceTreeUseCase
  }
  readonly settings: AdminSettingsUseCase
  readonly users: AdminUserUseCase
}

export type AdminApiDependencies = {
  readonly aiChatAgent?: AdminAiChatAgent
  readonly aiChatEventLogger?: {
    readonly info: (
      event: Readonly<Record<string, unknown>>,
      message: string
    ) => void
    readonly warn: (
      event: Readonly<Record<string, unknown>>,
      message: string
    ) => void
  }
  readonly aiChatRequestGuard?: AiChatRequestGuard
  readonly adminServices: AdminApiServices
  readonly adminMfaRecovery: AdminMfaRecoveryService
  readonly adminOrigin?: string
  readonly authHandler?: (request: Request) => Promise<Response>
  readonly errorLogger?: InternalErrorLogger
  readonly now?: () => Date
  readonly requestLogger?: RequestLogger
  readonly requestLoggingRuntime?: RequestLoggingRuntime
  readonly securityAuditLogger?: SecurityAuditLogger
  readonly resourceDocumentOperations: ResourceDocumentOperationCoordinator
  readonly resourceEvents: ResourceEventsWorkspace
  readonly sessionResolver: AdminSessionResolver
}

export function createApp(dependencies: AdminApiDependencies): OpenAPIHono {
  const now = dependencies.now ?? (() => new Date())
  const aiChatRequestGuard =
    dependencies.aiChatRequestGuard ?? createAiChatRequestGuard()
  const app = createHonoApp({
    errorLogger: dependencies.errorLogger,
    middleware: createMiddleware(dependencies),
    routes: [
      healthRoute,
      ...createAdminMfaRoutes({
        recoveryService: dependencies.adminMfaRecovery,
        sessionResolver: dependencies.sessionResolver,
      }),
      createSessionRoute(dependencies.sessionResolver),
      ...createAiChatRoutes({
        aiChatAgent: dependencies.aiChatAgent,
        aiChatEventLogger: dependencies.aiChatEventLogger,
        aiChatRequestGuard,
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
        documentOperations: dependencies.resourceDocumentOperations,
        events: dependencies.resourceEvents,
        sessionResolver: dependencies.sessionResolver,
        treeService: dependencies.adminServices.resourceLibrary.tree,
      }),
      ...createResourceDocumentsRoutes({
        documentService: dependencies.adminServices.resourceLibrary.documents,
        documentOperations: dependencies.resourceDocumentOperations,
        events: dependencies.resourceEvents,
        now,
        sessionResolver: dependencies.sessionResolver,
      }),
      ...createResourceDocumentSyncRoutes({
        documentOperations: dependencies.resourceDocumentOperations,
        events: dependencies.resourceEvents,
        now,
        sessionResolver: dependencies.sessionResolver,
        syncService: dependencies.adminServices.resourceLibrary.sync,
      }),
      ...createResourceSearchRoutes({
        searchService: dependencies.adminServices.resourceLibrary.search,
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

    app.on(["GET", "POST"], "/api/auth/*", async (context) => {
      const request = await enforcePasswordChangeSessionRevocation(
        context.req.raw
      )

      return authHandler(request).then(withPrivateNoStore)
    })
  }

  app.get("/openapi", (context) => context.json(createOpenApiDocument(app)))

  return app
}

async function enforcePasswordChangeSessionRevocation(
  request: Request
): Promise<Request> {
  if (
    request.method !== "POST" ||
    new URL(request.url).pathname !== "/api/auth/change-password"
  ) {
    return request
  }

  let body: unknown
  try {
    body = await request.clone().json()
  } catch {
    return request
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return request
  }

  return new Request(request, {
    body: JSON.stringify({
      ...body,
      revokeOtherSessions: true,
    }),
  })
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
        logSecurityAudit: dependencies.securityAuditLogger,
        readActor(context) {
          const session = context.get("activeAdminSession")

          return session === undefined
            ? undefined
            : {
                id: session.admin.id,
                role: session.admin.role,
                type: "admin",
              }
        },
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
