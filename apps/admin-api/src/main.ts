import { serve } from "bun"
import { createAdminService } from "@workspace/core/admin"
import { createDrizzleAdminRepository } from "@workspace/core/admin/admin-drizzle.repository"
import {
  createResourceCollaborationUseCase,
  createResourceDocumentUseCase,
  createResourceSearchUseCase,
  createResourceTreeUseCase,
  toResourceAuditEventId,
  toResourceDocumentId,
  toResourceFolderId,
} from "@workspace/core/modules/resource-library/api"
import { createDrizzleResourceCollaborationRepository } from "@workspace/core/resource-library/resource-collaboration-drizzle.repository"
import { createDrizzleResourceDocumentRepository } from "@workspace/core/resource-library/resource-document-drizzle.repository"
import { createDrizzleResourceSearchRepository } from "@workspace/core/resource-library/resource-search-drizzle.repository"
import { createDrizzleResourceTreeRepository } from "@workspace/core/resource-library/resource-tree-drizzle.repository"
import { createWritingAppDatabase } from "@workspace/db"
import {
  createAppLogger,
  createRequestLogger,
  defaultRequestLoggingRuntime,
} from "@workspace/logger"

import { createApp } from "@/app"
import { createAdminAuth, createAdminSessionResolver } from "@/auth/admin-auth"
import { createResourceCollaborationUpgradeHandler } from "@/collaboration/resource-collaboration-upgrade"
import { createResourceCollaborationRooms } from "@/collaboration/resource-collaboration-rooms"
import { createResourceEventsHub } from "@/collaboration/resource-events-hub"
import { createResourceEventsUpgradeHandler } from "@/collaboration/resource-events-upgrade"
import { createResourceWebSocketHandler } from "@/collaboration/resource-websocket-handler"
import { createYWebSocketBunAdapter } from "@/collaboration/y-websocket-bun-adapter"
import { parseAdminApiEnv } from "@/env"
import {
  createAdminMastra,
  createMastraAdminAiChatAgent,
} from "@/mastra/admin-content-agent"

const env = parseAdminApiEnv(process.env)
const database = createWritingAppDatabase(env.databaseUrl)
const logger = createAppLogger()
const adminRepository = createDrizzleAdminRepository(database.db)
const resourceTreeRepository = createDrizzleResourceTreeRepository(database.db)
const resourceDocumentRepository = createDrizzleResourceDocumentRepository(
  database.db
)
const resourceCollaborationService = createResourceCollaborationUseCase(
  createDrizzleResourceCollaborationRepository(database.db)
)
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
  resourceRepository: adminRepository,
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
const collaborationAdapter = createYWebSocketBunAdapter({
  async onFlush(input) {
    const result = await resourceCollaborationService.flush({
      actorId: input.actorId,
      documentId: toResourceDocumentId(input.roomId),
      expectedStateVersion: input.expectedStateVersion,
      now: new Date(),
      snapshot: input.snapshot,
    })

    return result.kind === "ok"
      ? { kind: "ok", stateVersion: result.value.stateVersion }
      : { kind: "error" }
  },
})
const collaborationUpgradeHandler = createResourceCollaborationUpgradeHandler({
  adminOrigin: env.adminOrigin,
  collaborationService: resourceCollaborationService,
  sessionResolver,
})
const resourceCollaborationRooms =
  createResourceCollaborationRooms(collaborationAdapter)
const resourceEvents = createResourceEventsHub()
const eventsUpgradeHandler = createResourceEventsUpgradeHandler({
  adminOrigin: env.adminOrigin,
  sessionResolver,
})
const resourceWebSocketHandler = createResourceWebSocketHandler({
  collaboration: collaborationAdapter,
  events: resourceEvents,
})
const app = createApp({
  aiChatAgent,
  adminServices: {
    aiChat: adminService,
    analytics: adminService,
    contentReset: adminService,
    courses: adminService,
    dashboard: adminService,
    resources: adminService,
    resourceLibrary: {
      documents: resourceDocumentService,
      search: resourceSearchService,
      tree: resourceTreeService,
    },
    settings: adminService,
    users: adminService,
  },
  adminOrigin: env.adminOrigin,
  authHandler: auth.handler,
  requestLogger: createRequestLogger(logger),
  requestLoggingRuntime: defaultRequestLoggingRuntime,
  resourceCollaborationRooms,
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

      const collaborationResponse = await collaborationUpgradeHandler(
        request,
        (upgradeRequest, data) => bunServer.upgrade(upgradeRequest, { data })
      )

      if (collaborationResponse !== null) return collaborationResponse

      const eventsResponse = await eventsUpgradeHandler(
        request,
        (upgradeRequest, data) => bunServer.upgrade(upgradeRequest, { data })
      )

      return eventsResponse === null ? app.fetch(request) : eventsResponse
    },
    port: env.port,
    websocket: resourceWebSocketHandler,
  })

  const shutdown = async () => {
    if (shuttingDown) return

    shuttingDown = true
    await collaborationAdapter.dispose()
    server.stop(true)
    database.close()
  }

  process.once("SIGINT", () => void shutdown())
  process.once("SIGTERM", () => void shutdown())
}

export { app }
