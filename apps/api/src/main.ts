import { serve } from "bun"
import { createLearnerApiCore } from "@workspace/core/learner-api-core"
import {
  createAppLogger,
  createRequestLogger,
  createSecurityAuditLogger,
  defaultRequestLoggingRuntime,
} from "@workspace/logger"

import { createApp } from "@/app"
import { parseApiEnv } from "@/config/env"
import {
  createLearnerApiServerLifecycle,
  registerLearnerApiShutdownSignals,
} from "@/server-lifecycle"

const env = parseApiEnv(process.env)
const logger = createAppLogger()
const core = createLearnerApiCore({
  authBaseUrl: env.authBaseUrl,
  betterAuthSecret: env.betterAuthSecret,
  cookieDomain: env.cookieDomain,
  databaseUrl: env.databaseUrl,
  googleClientId: env.googleClientId,
  googleClientSecret: env.googleClientSecret,
  openAiApiKey: env.openAiApiKey,
  openAiModel: env.openAiModel,
  onAiFeedbackAttemptTransition(event) {
    const write = event.toStatus === "failed" ? logger.warn : logger.info
    write.call(logger, event, "ai.feedback.attempt.transition")
  },
  onOpenAiUsage(event) {
    logger.info(event, "ai.usage")
  },
  testAuthEnabled: env.testAuthEnabled,
  webOrigin: env.webOrigin,
})
const app = createApp({
  aiFeedbackService: core.aiFeedbackService,
  authHandler: core.authHandler,
  contentService: core.contentService,
  errorLogger(event) {
    logger.error(event, "request.failed")
  },
  learningService: core.learningService,
  profileReader: core.profileReader,
  progressService: core.progressService,
  requestLogger: createRequestLogger(logger),
  requestLoggingRuntime: defaultRequestLoggingRuntime,
  securityAuditLogger: createSecurityAuditLogger(logger),
  sessionResolver: core.sessionResolver,
  webOrigin: env.webOrigin,
})

if (import.meta.main) {
  const lifecycle = createLearnerApiServerLifecycle({
    closeCore: core.close,
    fetch: app.fetch,
    onShutdownError(error, phase) {
      logger.error({ error, phase }, "server.shutdown.failed")
    },
  })
  const server = serve({
    fetch: lifecycle.fetch,
    port: env.port,
  })
  lifecycle.attachServer(server)
  registerLearnerApiShutdownSignals(lifecycle.shutdown)
}

export { app }
