import { defaultRequestLoggingRuntime } from "@workspace/http-platform/request-logging"
import { createRequestLogger } from "@workspace/observability/request-logger"
import { createSecurityAuditLogger } from "@workspace/observability/security-audit-logger"

import type { ApiContainer } from "@/composition/create-container"
import { createAdminApp } from "@/http/admin-app"
import { createLearnerApp } from "@/http/learner-app"
import { createUnifiedApp } from "@/http/unified-app"

export function createApp(container: ApiContainer) {
  const { env, idGenerator, logger } = container.platform
  const requestLoggingRuntime = {
    createRequestId: idGenerator.next,
    readMonotonicTimeMs: defaultRequestLoggingRuntime.readMonotonicTimeMs,
  }
  const requestLogger = createRequestLogger(logger)
  const securityAuditLogger = createSecurityAuditLogger(logger)
  const learner = createLearnerApp({
    aiFeedbackRoutes: container.learner.aiFeedbackRoutes,
    authHandler: container.learner.authHandler,
    contractErrorLogger(event) {
      logger.error(event, "api.contract.response_invalid")
    },
    deploymentVersion: env.deploymentVersion,
    errorLogger(event) {
      logger.error(event, "request.failed")
    },
    health: container.health,
    identityRoutes: container.learner.identityRoutes,
    learningRoutes: container.learner.learningRoutes,
    now: container.platform.clock.now,
    requestLogger,
    requestLoggingRuntime,
    securityAuditLogger,
    sessionResolver: container.learner.sessionResolver,
    webOrigin: env.webOrigin,
  })
  const admin = createAdminApp({
    adminOrigin: env.adminOrigin,
    authHandler: container.admin.authHandler,
    capabilityRoutes: container.admin.capabilityRoutes,
    errorLogger(event) {
      logger.error(event, "request.failed")
    },
    health: container.health,
    requestLogger,
    requestLoggingRuntime,
    securityAuditLogger,
    sessionResolver: container.admin.sessionResolver,
  })
  const unified = createUnifiedApp({
    adminApp: admin,
    allowedHosts: env.allowedHosts,
    createRequestId: idGenerator.next,
    learnerApp: learner,
    onRejectedHost(event) {
      logger.warn(event, "request.host.rejected")
    },
  })

  return Object.freeze({ admin, fetch: unified.fetch, learner, unified })
}

export type ApiApp = ReturnType<typeof createApp>
