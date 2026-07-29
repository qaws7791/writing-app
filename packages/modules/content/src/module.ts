import type { WritingAppDatabase } from "@workspace/db/client"

import { createCleanupOrphanedAssets } from "#content/application/cleanup-orphaned-content-assets"
import type { CleanupOrphanedAssets } from "#content/application/cleanup-orphaned-content-assets"
import {
  createContentApplication,
  type ContentApplication,
} from "#content/application/content-application"
import type { ContentApplicationDependencies } from "#content/application/ports/content-ports"
import { createDrizzleContentRepository } from "#content/infrastructure/persistence/content-drizzle-repository"

export type ContentModule = Readonly<{
  application: ContentApplication
  maintenance: CleanupOrphanedAssets
}>

export function createContentModule(
  input: Omit<ContentApplicationDependencies, "repository"> &
    Readonly<{ database: WritingAppDatabase }>
): ContentModule {
  const repository = createDrizzleContentRepository(input.database)

  return {
    application: createContentApplication({ ...input, repository }),
    maintenance: createCleanupOrphanedAssets({
      assetStorage: input.assetStorage,
      repository,
    }),
  }
}

export { seedContentDatabase } from "#content/infrastructure/persistence/seed"
