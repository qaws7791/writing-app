import type { AdminAiChatUseCase } from "#core/modules/admin/application/use-cases/admin-ai-chat.use-case"
import type { AdminAnalyticsUseCase } from "#core/modules/admin/application/use-cases/admin-analytics.use-case"
import type { AdminContentResetUseCase } from "#core/modules/admin/application/use-cases/admin-content-reset.use-case"
import type { AdminCourseUseCase } from "#core/modules/admin/application/use-cases/admin-course.use-case"
import type { AdminDashboardUseCase } from "#core/modules/admin/application/use-cases/admin-dashboard.use-case"
import type { AdminSettingsUseCase } from "#core/modules/admin/application/use-cases/admin-settings.use-case"
import type { AdminUserUseCase } from "#core/modules/admin/application/use-cases/admin-user.use-case"
import { createAdminService } from "#core/modules/admin/application/use-cases/admin.service"
import { createDrizzleAdminRepository } from "#core/modules/admin/infrastructure/persistence/admin-drizzle.repository"
import type { ResourceDocumentUseCase } from "#core/modules/resource-library/application/use-cases/resource-document.use-case"
import type { ResourceAssetUseCase } from "#core/modules/resource-library/application/use-cases/resource-asset.use-case"
import type { ResourceSearchUseCase } from "#core/modules/resource-library/application/use-cases/resource-search.use-case"
import type { ResourceTreeUseCase } from "#core/modules/resource-library/application/use-cases/resource-tree.use-case"
import { createResourceDocumentUseCase } from "#core/modules/resource-library/application/use-cases/resource-document.use-case"
import { createResourceAssetUseCase } from "#core/modules/resource-library/application/use-cases/resource-asset.use-case"
import { createResourceSearchUseCase } from "#core/modules/resource-library/application/use-cases/resource-search.use-case"
import { createResourceTreeUseCase } from "#core/modules/resource-library/application/use-cases/resource-tree.use-case"
import {
  toResourceAssetId,
  toResourceDocumentId,
  toResourceFolderId,
} from "#core/modules/resource-library/domain/resource-tree-node"
import { createDrizzleResourceDocumentRepository } from "#core/modules/resource-library/infrastructure/persistence/resource-document-drizzle.repository"
import { createDrizzleResourceAssetRepository } from "#core/modules/resource-library/infrastructure/persistence/resource-asset-drizzle.repository"
import { createDrizzleResourceSearchRepository } from "#core/modules/resource-library/infrastructure/persistence/resource-search-drizzle.repository"
import { createDrizzleResourceTreeRepository } from "#core/modules/resource-library/infrastructure/persistence/resource-tree-drizzle.repository"
import type { WritingAppDatabase } from "@workspace/db/client"

export type AdminApiCoreServices = {
  readonly aiChat: AdminAiChatUseCase
  readonly analytics: AdminAnalyticsUseCase
  readonly contentReset: AdminContentResetUseCase
  readonly courses: AdminCourseUseCase
  readonly dashboard: AdminDashboardUseCase
  readonly resourceLibrary: {
    readonly assets: ResourceAssetUseCase
    readonly documents: ResourceDocumentUseCase
    readonly search: ResourceSearchUseCase
    readonly tree: ResourceTreeUseCase
  }
  readonly settings: AdminSettingsUseCase
  readonly users: AdminUserUseCase
}

export type AdminApiCore = {
  readonly services: AdminApiCoreServices
}

export function createAdminApiCore({
  database,
}: {
  readonly database: WritingAppDatabase
}): AdminApiCore {
  const adminRepository = createDrizzleAdminRepository(database)
  const adminService = createAdminService({
    aiChatRepository: adminRepository,
    analyticsReader: adminRepository,
    contentResetRepository: adminRepository,
    courseRepository: adminRepository,
    dashboardReader: adminRepository,
    settingsRepository: adminRepository,
    userRepository: adminRepository,
  })
  return {
    services: {
      aiChat: adminService,
      analytics: adminService,
      contentReset: adminService,
      courses: adminService,
      dashboard: adminService,
      resourceLibrary: {
        assets: createResourceAssetUseCase({
          assetRepository: createDrizzleResourceAssetRepository(database),
          createAssetId: () =>
            toResourceAssetId(`resource-asset-${crypto.randomUUID()}`),
        }),
        documents: createResourceDocumentUseCase({
          createDocumentId: () =>
            toResourceDocumentId(`resource-document-${crypto.randomUUID()}`),
          documentRepository: createDrizzleResourceDocumentRepository(database),
        }),
        search: createResourceSearchUseCase(
          createDrizzleResourceSearchRepository(database)
        ),
        tree: createResourceTreeUseCase({
          createDocumentId: () =>
            toResourceDocumentId(`resource-document-${crypto.randomUUID()}`),
          createFolderId: () =>
            toResourceFolderId(`resource-folder-${crypto.randomUUID()}`),
          treeRepository: createDrizzleResourceTreeRepository(database),
        }),
      },
      settings: adminService,
      users: adminService,
    },
  }
}
