import type { AdminAiChatUseCase } from "#core/modules/admin/application/use-cases/admin-ai-chat.use-case"
import type { AdminAnalyticsUseCase } from "#core/modules/admin/application/use-cases/admin-analytics.use-case"
import type { AdminContentResetUseCase } from "#core/modules/admin/application/use-cases/admin-content-reset.use-case"
import type { AdminCourseUseCase } from "#core/modules/admin/application/use-cases/admin-course.use-case"
import type { AdminDashboardUseCase } from "#core/modules/admin/application/use-cases/admin-dashboard.use-case"
import type { AdminSettingsUseCase } from "#core/modules/admin/application/use-cases/admin-settings.use-case"
import type { AdminUserUseCase } from "#core/modules/admin/application/use-cases/admin-user.use-case"
import { createAdminService } from "#core/modules/admin/application/use-cases/admin.service"
import { createDrizzleAdminRepository } from "#core/modules/admin/infrastructure/persistence/admin-drizzle.repository"
import type { ResourceDocumentSyncUseCase } from "#core/modules/resource-library/application/use-cases/resource-document-sync.use-case"
import type { ResourceDocumentUseCase } from "#core/modules/resource-library/application/use-cases/resource-document.use-case"
import type { ResourceSearchUseCase } from "#core/modules/resource-library/application/use-cases/resource-search.use-case"
import type { ResourceTreeUseCase } from "#core/modules/resource-library/application/use-cases/resource-tree.use-case"
import { createResourceDocumentSyncUseCase } from "#core/modules/resource-library/application/use-cases/resource-document-sync.use-case"
import { createResourceDocumentUseCase } from "#core/modules/resource-library/application/use-cases/resource-document.use-case"
import { createResourceSearchUseCase } from "#core/modules/resource-library/application/use-cases/resource-search.use-case"
import { createResourceTreeUseCase } from "#core/modules/resource-library/application/use-cases/resource-tree.use-case"
import {
  toResourceAuditEventId,
  toResourceDocumentId,
  toResourceFolderId,
} from "#core/modules/resource-library/domain/resource-tree-node"
import { createDrizzleResourceDocumentRepository } from "#core/modules/resource-library/infrastructure/persistence/resource-document-drizzle.repository"
import { createDrizzleResourceDocumentSyncRepository } from "#core/modules/resource-library/infrastructure/persistence/resource-document-sync-drizzle.repository"
import { createDrizzleResourceSearchRepository } from "#core/modules/resource-library/infrastructure/persistence/resource-search-drizzle.repository"
import { createDrizzleResourceTreeRepository } from "#core/modules/resource-library/infrastructure/persistence/resource-tree-drizzle.repository"
import { createWritingAppDatabase } from "@workspace/db"

export type AdminApiCoreServices = {
  readonly aiChat: AdminAiChatUseCase
  readonly analytics: AdminAnalyticsUseCase
  readonly contentReset: AdminContentResetUseCase
  readonly courses: AdminCourseUseCase
  readonly dashboard: AdminDashboardUseCase
  readonly resourceLibrary: {
    readonly documents: ResourceDocumentUseCase
    readonly search: ResourceSearchUseCase
    readonly sync: ResourceDocumentSyncUseCase
    readonly tree: ResourceTreeUseCase
  }
  readonly settings: AdminSettingsUseCase
  readonly users: AdminUserUseCase
}

export type AdminApiCore = {
  readonly close: () => void
  readonly database: ReturnType<typeof createWritingAppDatabase>["db"]
  readonly databaseClient: ReturnType<typeof createWritingAppDatabase>
  readonly services: AdminApiCoreServices
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
  const close = createCloseOnce(database.close)

  return {
    close,
    database: database.db,
    databaseClient: database,
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
        sync: createResourceDocumentSyncUseCase(
          createDrizzleResourceDocumentSyncRepository(database.db),
          { onRejected: onResourceSyncRejected }
        ),
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
