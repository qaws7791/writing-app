import { serve } from "bun"
import {
  createAppLogger,
  createRequestLogger,
  createSecurityAuditLogger,
  defaultRequestLoggingRuntime,
} from "@workspace/logger"

import { createAdminApiRuntime } from "@/admin-runtime"
import { createApp } from "@/app"
import { parseAdminApiEnv } from "@/env"
import {
  createAdminMastra,
  createMastraAdminAiChatAgent,
} from "@/mastra/admin-content-agent"
import { createR2ResourceAssetStore } from "@/resource-assets/resource-asset-store"

const env = parseAdminApiEnv(process.env)
const logger = createAppLogger()
const runtime = createAdminApiRuntime({ env })
const resourceAssetStore =
  env.assetStore === undefined
    ? undefined
    : createR2ResourceAssetStore(env.assetStore)
const aiChatAgent =
  env.openAiApiKey === undefined
    ? undefined
    : createMastraAdminAiChatAgent(
        createAdminMastra({
          openAiApiKey: env.openAiApiKey,
          openAiModel: env.openAiModel,
          resourceLibrary: runtime.services.resourceLibrary,
        })
      )
const app = createApp({
  aiChatAgent,
  aiChatEventLogger: logger,
  adminServices: runtime.services,
  adminOrigin: env.adminOrigin,
  authHandler: runtime.authHandler,
  errorLogger(event) {
    logger.error(event, "request.failed")
  },
  requestLogger: createRequestLogger(logger),
  requestLoggingRuntime: defaultRequestLoggingRuntime,
  resourceAssetStore,
  resourceAssetEventLogger: logger,
  securityAuditLogger: createSecurityAuditLogger(logger),
  sessionResolver: runtime.sessionResolver,
})

if (import.meta.main) {
  let shuttingDown = false
  const server = serve({
    fetch(request) {
      return shuttingDown
        ? new Response("서버가 종료 중입니다.", { status: 503 })
        : app.fetch(request)
    },
    port: env.port,
  })

  const shutdown = () => {
    if (shuttingDown) return
    shuttingDown = true
    server.stop(true)
    runtime.close()
  }
  process.once("SIGINT", shutdown)
  process.once("SIGTERM", shutdown)
}

export { app }
