import type { WritingAppDatabase } from "@workspace/db/client"

import {
  createCleanupOrphanedAssets,
  type CleanupOrphanedAssets,
  type CleanupOrphanedAssetsInput,
  type CleanupOrphanedAssetsResult,
} from "#content/application/cleanup-orphaned-content-assets"
import type { ContentAssetStoragePort } from "#content/application/ports/content-ports"
import { contentAssetOrphanRetentionMs } from "#content/domain/content-asset"
import { createDrizzleContentRepository } from "#content/infrastructure/persistence/content-drizzle-repository"

export function createContentAssetMaintenance(input: {
  readonly assetStorage: ContentAssetStoragePort | null
  readonly database: WritingAppDatabase
}): CleanupOrphanedAssets {
  return createCleanupOrphanedAssets({
    assetStorage: input.assetStorage,
    repository: createDrizzleContentRepository(input.database),
  })
}

export type {
  CleanupOrphanedAssets,
  CleanupOrphanedAssetsInput,
  CleanupOrphanedAssetsResult,
}
export { contentAssetOrphanRetentionMs }
