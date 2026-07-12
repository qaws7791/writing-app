import { serve } from "bun"
import { toResourceDocumentId } from "@workspace/core/modules/resource-library/api"
import { createResourceDocumentOperationCoordinator } from "@/resource-library/resource-document-operation-coordinator"
import {
  createAppLogger,
  createRequestLogger,
  createSecurityAuditLogger,
  defaultRequestLoggingRuntime,
} from "@workspace/logger"

import { createApp } from "@/app"
import { createAdminApiCore } from "@/admin-api-core"
import {
  createAdminAuth,
  createAdminAuthHandler,
  createAdminSessionResolver,
} from "@/auth/admin-auth"
import { createAdminMfaRecoveryService } from "@/auth/admin-mfa-recovery"
import { createResourceEventsHub } from "@/collaboration/resource-events-hub"
import { createResourceEventsUpgradeHandler } from "@/collaboration/resource-events-upgrade"
import { parseAdminApiEnv } from "@/env"
import {
  createAdminMastra,
  createMastraAdminAiChatAgent,
} from "@/mastra/admin-content-agent"

const env = parseAdminApiEnv(process.env)
const logger = createAppLogger()
const securityAuditLogger = createSecurityAuditLogger(logger)
const core = createAdminApiCore({
  databaseUrl: env.databaseUrl,
  onResourceSyncRejected(event) {
    logger.warn(event, "resource-document.sync.rejected")
  },
})
const resourceDocumentOperations = createResourceDocumentOperationCoordinator()
const aiChatAgent =
  env.openAiApiKey === undefined
    ? undefined
    : createMastraAdminAiChatAgent(
        createAdminMastra({
          openAiApiKey: env.openAiApiKey,
          openAiModel: env.openAiModel,
        })
      )
const auth = createAdminAuth({
  authBaseUrl: env.authBaseUrl,
  cookieDomain: env.cookieDomain,
  db: core.database,
  secret: env.betterAuthSecret,
  webOrigin: env.adminOrigin,
})
const sessionResolver = createAdminSessionResolver(auth)
const authHandler = createAdminAuthHandler({
  auth,
  cookieDomain: env.cookieDomain,
  database: core.databaseClient,
})
const adminMfaRecovery = createAdminMfaRecoveryService({
  database: core.databaseClient,
})
const resourceEvents = createResourceEventsHub({
  onPolicyViolation({ actorId, reason }) {
    securityAuditLogger({
      action: "websocket.authorization.rejected",
      actorId,
      actorType: "admin",
      outcome: "denied",
      reason,
      requestId: crypto.randomUUID(),
      target: "GET /resources/events",
    })
  },
  async readDocumentStateVersion(documentId) {
    const result = await core.services.resourceLibrary.sync.readSync({
      afterStateVersion: 0,
      documentId: toResourceDocumentId(documentId),
      mode: "incremental",
    })

    return result.kind === "inactive" || result.kind === "not-found"
      ? null
      : result.stateVersion
  },
  sessionResolver,
})
const eventsUpgradeHandler = createResourceEventsUpgradeHandler({
  adminOrigin: env.adminOrigin,
  onAuthorizationRejected(reason) {
    securityAuditLogger({
      action: "websocket.authorization.rejected",
      outcome: "denied",
      reason,
      requestId: crypto.randomUUID(),
      target: "GET /resources/events",
    })
  },
  sessionResolver,
})
const app = createApp({
  aiChatAgent,
  aiChatEventLogger: logger,
  adminServices: core.services,
  adminMfaRecovery,
  adminOrigin: env.adminOrigin,
  authHandler,
  errorLogger(event) {
    logger.error(event, "request.failed")
  },
  requestLogger: createRequestLogger(logger),
  requestLoggingRuntime: defaultRequestLoggingRuntime,
  securityAuditLogger,
  resourceDocumentOperations,
  resourceEvents,
  sessionResolver,
})

if (import.meta.main) {
  let shuttingDown = false
  const server = serve({
    async fetch(request, bunServer) {
      if (shuttingDown) {
        return new Response("서버가 종료 중입니다.", { status: 503 })
      }

      const eventsResponse = await eventsUpgradeHandler(
        request,
        (upgradeRequest, data) => bunServer.upgrade(upgradeRequest, { data }),
        bunServer.requestIP(request)?.address ?? "unknown"
      )

      return eventsResponse === null ? app.fetch(request) : eventsResponse
    },
    port: env.port,
    websocket: resourceEvents.websocket,
  })

  const shutdown = async () => {
    if (shuttingDown) return

    shuttingDown = true
    server.stop(true)
    core.close()
  }

  process.once("SIGINT", () => void shutdown())
  process.once("SIGTERM", () => void shutdown())
}

export { app }
