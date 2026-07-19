import { serve } from "bun"
import { createConfiguredAiFeedbackProvider } from "@/adapters/ai-feedback/openai-feedback-provider"
import { createApiRuntime } from "@/api-runtime"
import { createApp } from "@/app"
import { parseApiEnv } from "@/config/env"
import { createAdminApp } from "@/http/admin-app"
import { createUnifiedApp } from "@/http/unified-app"
import { defaultRequestLoggingRuntime } from "@/http/platform/request-logging.middleware"
import { createAppLogger } from "@/observability/app-logger"
import { createRequestLogger } from "@/observability/request-logger"
import { createSecurityAuditLogger } from "@/observability/security-audit-logger"
import {
  createUnifiedApiServerLifecycle,
  registerUnifiedApiShutdownSignals,
} from "@/server-lifecycle"

const env = parseApiEnv(process.env)
const logger = createAppLogger()
const aiFeedbackProvider = createConfiguredAiFeedbackProvider({
  apiKey: env.openAiApiKey,
  model: env.openAiModel,
  onUsage(event) {
    logger.info(event, "ai.usage")
  },
})
const runtime = createApiRuntime({
  aiFeedbackProvider,
  env,
  logger,
  onAiFeedbackAttemptTransition(event) {
    const write = event.toStatus === "failed" ? logger.warn : logger.info
    write.call(logger, event, "ai.feedback.attempt.transition")
  },
})
const { adminApp, learnerApp, unifiedFetch } = (() => {
  try {
    const learnerApp = createApp({
      authHandler: runtime.learnerCore.authHandler,
      contentService: runtime.learnerCore.contentService,
      contractErrorLogger(event) {
        logger.error(event, "api.contract.response_invalid")
      },
      deploymentVersion: env.deploymentVersion,
      errorLogger(event) {
        logger.error(event, "request.failed")
      },
      learnerAiFeedbackService: runtime.learnerCore.learnerAiFeedbackService,
      learnerCursorCodec: runtime.learnerCore.learnerCursorCodec,
      learnerTransitionRepository:
        runtime.learnerCore.learnerTransitionRepository,
      profileReader: runtime.learnerCore.profileReader,
      progressService: runtime.learnerCore.progressService,
      requestLogger: createRequestLogger(logger),
      requestLoggingRuntime: defaultRequestLoggingRuntime,
      securityAuditLogger: createSecurityAuditLogger(logger),
      sessionResolver: runtime.learnerCore.sessionResolver,
      webOrigin: env.webOrigin,
    })
    const adminApp = createAdminApp({
      adminOrigin: env.adminOrigin,
      authHandler: runtime.adminAuth.authHandler,
      capabilityRoutes: runtime.adminCapabilityRoutes,
      errorLogger(event) {
        logger.error(event, "request.failed")
      },
      requestLogger: createRequestLogger(logger),
      requestLoggingRuntime: defaultRequestLoggingRuntime,
      securityAuditLogger: createSecurityAuditLogger(logger),
      sessionResolver: runtime.adminAuth.sessionResolver,
    })
    const unifiedFetch = createUnifiedApp({
      adminApp,
      allowedHosts: env.allowedHosts,
      learnerApp,
      onRejectedHost(event) {
        logger.warn(event, "request.host.rejected")
      },
    }).fetch

    return { adminApp, learnerApp, unifiedFetch }
  } catch (error) {
    runtime.dispose()
    throw error
  }
})()

if (import.meta.main) {
  const lifecycle = createUnifiedApiServerLifecycle({
    closeDatabase: runtime.dispose,
    fetch: unifiedFetch,
    onShutdownError(error, phase) {
      logger.error({ error, phase }, "server.shutdown.failed")
    },
  })
  let server: ReturnType<typeof serve> | undefined
  try {
    server = serve({
      fetch: lifecycle.fetch,
      port: env.port,
    })
    lifecycle.attachServer(server)
    registerUnifiedApiShutdownSignals(lifecycle.shutdown)
  } catch (error) {
    try {
      await server?.stop(true)
    } catch (stopError) {
      logger.error(
        { error: stopError, phase: "force-stop-server" },
        "server.shutdown.failed"
      )
    }
    runtime.dispose()
    throw error
  }
}

export { learnerApp as app, adminApp, unifiedFetch }
