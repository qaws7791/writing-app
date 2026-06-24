import { serve } from "bun"
import { createLearnerApiCore } from "@workspace/core/modules/learner-api"
import {
  createAppLogger,
  createRequestLogger,
  defaultRequestLoggingRuntime,
} from "@workspace/logger"

import { createApp } from "@/app"
import { parseApiEnv } from "@/config/env"

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
  testAuthEnabled: env.testAuthEnabled,
  webOrigin: env.webOrigin,
})
const app = createApp({
  aiFeedbackService: core.aiFeedbackService,
  authHandler: core.authHandler,
  contentService: core.contentService,
  learningService: core.learningService,
  profileReader: core.profileReader,
  progressService: core.progressService,
  requestLogger: createRequestLogger(logger),
  requestLoggingRuntime: defaultRequestLoggingRuntime,
  sessionResolver: core.sessionResolver,
  webOrigin: env.webOrigin,
})

if (import.meta.main) {
  serve({
    fetch: app.fetch,
    port: env.port,
  })
}

export { app }
