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

import type { AdminApiServices } from "@/app"

export type AdminApiCore = {
  readonly close: () => void
  readonly database: ReturnType<typeof createWritingAppDatabase>["db"]
  readonly services: AdminApiServices
}

export function createAdminApiCore({
  databaseUrl,
  onResourceSyncRejected,
}: {
  readonly databaseUrl: string | undefined
  readonly onResourceSyncRejected: (
    event: Readonly<Record<string, unknown>>
  ) => void
}): AdminApiCore {
  const database = createWritingAppDatabase(databaseUrl)
  const adminRepository = createDrizzleAdminRepository(database.db)
  const createResourceAuditEventId = () =>
    toResourceAuditEventId(`resource-audit-${crypto.randomUUID()}`)
  const adminService = createAdminService({
    aiChatRepository: adminRepository,
    analyticsReader: adminRepository,
    contentResetRepository: adminRepository,
    courseRepository: adminRepository,
    dashboardReader: adminRepository,
    settingsRepository: adminRepository,
    userRepository: adminRepository,
  })
  const resourceDocumentSyncService = createResourceDocumentSyncUseCase(
    createDrizzleResourceDocumentSyncRepository(database.db),
    { onRejected: onResourceSyncRejected }
  )
  const close = createCloseOnce(database.close)

  return {
    close,
    database: database.db,
    services: {
      aiChat: adminService,
      analytics: adminService,
      contentReset: adminService,
      courses: adminService,
      dashboard: adminService,
      resourceLibrary: {
        documents: createResourceDocumentUseCase({
          createAuditEventId: createResourceAuditEventId,
          createDocumentId: () =>
            toResourceDocumentId(`resource-document-${crypto.randomUUID()}`),
          documentRepository: createDrizzleResourceDocumentRepository(
            database.db
          ),
        }),
        search: createResourceSearchUseCase(
          createDrizzleResourceSearchRepository(database.db)
        ),
        sync: resourceDocumentSyncService,
        tree: createResourceTreeUseCase({
          createAuditEventId: createResourceAuditEventId,
          createDocumentId: () =>
            toResourceDocumentId(`resource-document-${crypto.randomUUID()}`),
          createFolderId: () =>
            toResourceFolderId(`resource-folder-${crypto.randomUUID()}`),
          treeRepository: createDrizzleResourceTreeRepository(database.db),
        }),
      },
      settings: adminService,
      users: adminService,
    },
  }
}

export function createCloseOnce(close: () => void): () => void {
  let closed = false

  return () => {
    if (closed) return
    closed = true
    close()
  }
}
