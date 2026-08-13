import type { ContentAdminSessionPort } from "@workspace/content/ports"
import { registerContentRoutes } from "@workspace/content/http"
import { defaultRequestLoggingRuntime } from "@workspace/http-platform/app"
import type { OpenAPIHono } from "@hono/zod-openapi"
import {
  registerAdminIdentityRoutes,
  registerLearnerIdentityRoutes,
} from "@workspace/identity/http"
import type { AdminSessionResolver } from "@workspace/identity/ports"
import { registerLearningRoutes } from "@workspace/learning/http"
import { createRequestLogger } from "@workspace/observability/request-logger"
import { createSecurityAuditLogger } from "@workspace/observability/security-audit-logger"
import { registerOperationsRoutes } from "@workspace/operations/http"
import {
  registerWritingAdminRoutes,
  registerWritingRoutes,
} from "@workspace/writing/http"
import type { WritingAdminSessionPort } from "@workspace/writing/http"

import { registerAdminFoundationRoutes } from "@/http/admin-foundation.routes"
import type { AdminHonoEnv } from "@/http/admin-hono-env"
import type { ApiContainer } from "@/composition/create-container"
import { createOperationsAdminSessionPort } from "@/composition/operations-module.composition"
import {
  createAdminApp,
  registerAdminApiDocumentation,
  registerAdminAuthRoutes,
} from "@/http/admin-app"
import { registerAuthProxy } from "@/http/auth-proxy"
import { registerHealthRoutes } from "@/http/health-routes"
import { createLearnerApp } from "@/http/learner-app"
import { registerLearnerApiDocumentation } from "@/http/openapi"
import { createUnifiedApp } from "@/http/unified-app"
import { createAdminAuditMiddleware } from "@/observability/admin-audit.middleware"
import type { ApiHonoEnv } from "@/middleware/hono-env"
import type { ApiHealthProbe } from "@/runtime/api-health"

export type LearnerContractRouteDependencies = Readonly<{
  health: ApiHealthProbe
  identity: Parameters<typeof registerLearnerIdentityRoutes>[1]
  learning: Parameters<typeof registerLearningRoutes>[1]
  writing: Parameters<typeof registerWritingRoutes>[1]
}>

export type AdminContractRouteDependencies = Readonly<{
  content: Parameters<typeof registerContentRoutes>[1]
  foundation: Parameters<typeof registerAdminFoundationRoutes>[1]
  identity: Parameters<typeof registerAdminIdentityRoutes>[1]
  operations: Parameters<typeof registerOperationsRoutes>[1]
  writing: Parameters<typeof registerWritingAdminRoutes>[1]
}>

export function createApp(container: ApiContainer) {
  const { env, idGenerator, logger } = container.platform
  const requestLoggingRuntime = {
    createRequestId: idGenerator.next,
    readMonotonicTimeMs: defaultRequestLoggingRuntime.readMonotonicTimeMs,
  }
  const requestLogger = createRequestLogger(logger)
  const securityAuditLogger = createSecurityAuditLogger(logger)

  const learner = createLearnerApp({
    contractErrorLogger(event) {
      logger.error(event, "api.contract.response_invalid")
    },
    deploymentVersion: env.deploymentVersion,
    errorLogger(event) {
      logger.error(event, "request.failed")
    },
    requestLogger,
    requestLoggingRuntime,
    securityAuditLogger,
    webOrigin: env.webOrigin,
  })
  registerLearnerContractRoutes(learner, {
    health: container.health,
    identity: {
      application: container.modules.identity.application,
      profileStatsQuery: container.modules.learning.profileStatsQuery,
      sessionResolver: container.learner.sessionResolver,
    },
    learning: {
      application: container.modules.learning.application,
      cursor: container.modules.learning.cursor,
      session: container.learner.learningSession,
    },
    writing: {
      application: container.modules.writing.application,
      session: container.learner.writingSession,
    },
  })
  registerAuthProxy(learner, container.learner.authHandler)
  registerLearnerApiDocumentation(learner, { enabled: env.enableApiDocs })

  const adminSession = createOperationsAdminSessionPort(
    container.admin.sessionResolver
  )
  const admin = createAdminApp({
    adminOrigin: env.adminOrigin,
    auditMiddleware: createAdminAuditMiddleware({
      auditTrail: container.modules.operations.auditTrail,
      sessionResolver: container.admin.sessionResolver,
    }),
    errorLogger(event) {
      logger.error(event, "request.failed")
    },
    requestLogger,
    requestLoggingRuntime,
    securityAuditLogger,
  })
  registerAdminContractRoutes(admin, {
    content: {
      application: container.modules.content.application,
      sessionPort: createContentAdminSessionPort(
        container.admin.sessionResolver
      ),
    },
    foundation: {
      health: container.health,
      sessionResolver: container.admin.sessionResolver,
    },
    identity: {
      sessionResolver: container.admin.sessionResolver,
      userMutationService: container.modules.identity.adminUserMutation,
      userReader: container.modules.identity.adminUserReader,
    },
    operations: {
      adminMcpApprovals: container.modules.operations.adminMcpApprovals,
      auditTrail: container.modules.operations.auditTrail,
      now: container.platform.clock.now,
      reporting: container.modules.operations.reporting,
      session: adminSession,
    },
    writing: {
      application: container.modules.writing.adminApplication,
      sessionPort: createWritingAdminSessionPort(
        container.admin.sessionResolver
      ),
    },
  })
  registerAdminAuthRoutes(admin, container.admin.authHandler)
  registerAdminApiDocumentation(admin, { enabled: env.enableApiDocs })

  const unified = createUnifiedApp({
    adminApp: admin,
    ...(container.admin.mcp === undefined || env.adminMcp === undefined
      ? {}
      : {
          adminMcp: {
            runtime: container.admin.mcp,
          },
        }),
    createRequestId: idGenerator.next,
    learnerApp: learner,
  })

  return { admin, fetch: unified.fetch, learner, unified }
}

export type ApiApp = ReturnType<typeof createApp>

export function registerLearnerContractRoutes(
  app: OpenAPIHono<ApiHonoEnv>,
  dependencies: LearnerContractRouteDependencies
): void {
  registerHealthRoutes(app, dependencies.health)
  registerLearnerIdentityRoutes(app, dependencies.identity)
  registerLearningRoutes(app, dependencies.learning)
  registerWritingRoutes(app, dependencies.writing)
}

export function registerAdminContractRoutes(
  app: OpenAPIHono<AdminHonoEnv>,
  dependencies: AdminContractRouteDependencies
): void {
  registerAdminFoundationRoutes(app, dependencies.foundation)
  registerContentRoutes(app, dependencies.content)
  registerAdminIdentityRoutes(app, dependencies.identity)
  registerOperationsRoutes(app, dependencies.operations)
  registerWritingAdminRoutes(app, dependencies.writing)
}

function createContentAdminSessionPort(
  sessionResolver: AdminSessionResolver
): ContentAdminSessionPort {
  return {
    async resolveAdminId(headers) {
      const session = await sessionResolver.resolveSession(headers)
      return session?.admin.id ?? null
    },
  }
}

function createWritingAdminSessionPort(
  sessionResolver: AdminSessionResolver
): WritingAdminSessionPort {
  return {
    async resolveAdminId(headers) {
      const session = await sessionResolver.resolveSession(headers)
      return session?.admin.id ?? null
    },
  }
}
