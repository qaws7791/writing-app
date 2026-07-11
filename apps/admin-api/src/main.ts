import { serve } from "bun"
import { createAdminService } from "@workspace/core/admin"
import { createDrizzleAdminRepository } from "@workspace/core/admin/admin-drizzle.repository"
import {
  createResourceDocumentUseCase,
  createResourceDocumentSyncUseCase,
  createResourceSearchUseCase,
  createResourceTreeUseCase,
  toResourceAuditEventId,
  toResourceDocumentId,
  toResourceFolderId,
} from "@workspace/core/modules/resource-library/api"
import { createDrizzleResourceDocumentRepository } from "@workspace/core/resource-library/resource-document-drizzle.repository"
import { createDrizzleResourceDocumentSyncRepository } from "@workspace/core/resource-library/resource-document-sync-drizzle.repository"
import { createDrizzleResourceSearchRepository } from "@workspace/core/resource-library/resource-search-drizzle.repository"
import { createDrizzleResourceTreeRepository } from "@workspace/core/resource-library/resource-tree-drizzle.repository"
import { createWritingAppDatabase } from "@workspace/db"
import { createResourceDocumentOperationCoordinator } from "@/resource-library/resource-document-operation-coordinator"
import {
  createAppLogger,
  createRequestLogger,
  createSecurityAuditLogger,
  defaultRequestLoggingRuntime,
} from "@workspace/logger"

import { createApp } from "@/app"
import { createAdminAuth, createAdminSessionResolver } from "@/auth/admin-auth"
import { createResourceEventsHub } from "@/collaboration/resource-events-hub"
import { createResourceEventsUpgradeHandler } from "@/collaboration/resource-events-upgrade"
import { parseAdminApiEnv } from "@/env"
import {
  createAdminMastra,
  createMastraAdminAiChatAgent,
} from "@/mastra/admin-content-agent"

const env = parseAdminApiEnv(process.env)
const database = createWritingAppDatabase(env.databaseUrl)
const logger = createAppLogger()
const securityAuditLogger = createSecurityAuditLogger(logger)
const adminRepository = createDrizzleAdminRepository(database.db)
const resourceTreeRepository = createDrizzleResourceTreeRepository(database.db)
const resourceDocumentRepository = createDrizzleResourceDocumentRepository(
  database.db
)
const resourceDocumentSyncService = createResourceDocumentSyncUseCase(
  createDrizzleResourceDocumentSyncRepository(database.db)
)
const resourceDocumentOperations = createResourceDocumentOperationCoordinator()
const createResourceAuditEventId = () =>
  toResourceAuditEventId(`resource-audit-${crypto.randomUUID()}`)
const resourceTreeService = createResourceTreeUseCase({
  createAuditEventId: createResourceAuditEventId,
  createDocumentId: () =>
    toResourceDocumentId(`resource-document-${crypto.randomUUID()}`),
  createFolderId: () =>
    toResourceFolderId(`resource-folder-${crypto.randomUUID()}`),
  treeRepository: resourceTreeRepository,
})
const resourceDocumentService = createResourceDocumentUseCase({
  createAuditEventId: createResourceAuditEventId,
  createDocumentId: () =>
    toResourceDocumentId(`resource-document-${crypto.randomUUID()}`),
  documentRepository: resourceDocumentRepository,
})
const resourceSearchService = createResourceSearchUseCase(
  createDrizzleResourceSearchRepository(database.db)
)
const aiChatAgent =
  env.openAiApiKey === undefined
    ? undefined
    : createMastraAdminAiChatAgent(
        createAdminMastra({
          openAiApiKey: env.openAiApiKey,
          openAiModel: env.openAiModel,
        })
      )
const adminService = createAdminService({
  aiChatRepository: adminRepository,
  analyticsReader: adminRepository,
  contentResetRepository: adminRepository,
  courseRepository: adminRepository,
  dashboardReader: adminRepository,
  settingsRepository: adminRepository,
  userRepository: adminRepository,
})
const auth = createAdminAuth({
  authBaseUrl: env.authBaseUrl,
  cookieDomain: env.cookieDomain,
  db: database.db,
  secret: env.betterAuthSecret,
  webOrigin: env.adminOrigin,
})
const sessionResolver = createAdminSessionResolver(auth)
const resourceEvents = createResourceEventsHub({
  async readDocumentStateVersion(documentId) {
    const result = await resourceDocumentSyncService.readSync({
      afterStateVersion: 0,
      documentId: toResourceDocumentId(documentId),
      mode: "incremental",
    })

    return result.kind === "inactive" || result.kind === "not-found"
      ? null
      : result.stateVersion
  },
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
  adminServices: {
    aiChat: adminService,
    analytics: adminService,
    contentReset: adminService,
    courses: adminService,
    dashboard: adminService,
    resourceLibrary: {
      documents: resourceDocumentService,
      search: resourceSearchService,
      sync: resourceDocumentSyncService,
      tree: resourceTreeService,
    },
    settings: adminService,
    users: adminService,
  },
  adminOrigin: env.adminOrigin,
  authHandler: auth.handler,
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
        (upgradeRequest, data) => bunServer.upgrade(upgradeRequest, { data })
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
    database.close()
  }

  process.once("SIGINT", () => void shutdown())
  process.once("SIGTERM", () => void shutdown())
}

export { app }
