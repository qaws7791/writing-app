import {
  createResourceAssetUseCase,
  createResourceDocumentUseCase,
  createResourceSearchUseCase,
  createResourceTreeUseCase,
  toResourceAssetId,
  toResourceDocumentId,
  toResourceFolderId,
} from "@workspace/core/resource-library"

import { createDrizzleResourceAssetRepository } from "@/adapters/resource-library/resource-asset-drizzle.repository"
import { createDrizzleResourceDocumentRepository } from "@/adapters/resource-library/resource-document-drizzle.repository"
import { createDrizzleResourceSearchRepository } from "@/adapters/resource-library/resource-search-drizzle.repository"
import { createDrizzleResourceTreeRepository } from "@/adapters/resource-library/resource-tree-drizzle.repository"
import type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"
import type { AdminRouteGroup } from "@/http/admin-route-group"
import { createAdminResourceLibraryRoutes } from "@/modules/admin-resource-library/admin-resource-library.routes"
import { createR2ResourceAssetStore } from "@/resource-assets/resource-asset-store"

export function composeAdminResourceLibraryRouteGroup(
  context: AdminRouteCompositionContext
): AdminRouteGroup {
  const assetStore =
    context.env.adminAssetStore === undefined
      ? undefined
      : createR2ResourceAssetStore(context.env.adminAssetStore)
  const createDocumentId = () =>
    toResourceDocumentId(`resource-document-${crypto.randomUUID()}`)

  return createAdminResourceLibraryRoutes({
    assetEventLogger: {
      error(event, message) {
        context.logger.error(event, message)
      },
    },
    assetService: createResourceAssetUseCase({
      assetRepository: createDrizzleResourceAssetRepository(context.database),
      createAssetId: () =>
        toResourceAssetId(`resource-asset-${crypto.randomUUID()}`),
    }),
    assetStore,
    documentService: createResourceDocumentUseCase({
      createDocumentId,
      documentRepository: createDrizzleResourceDocumentRepository(
        context.database
      ),
    }),
    now: context.now,
    onObjectsDeleted:
      assetStore === undefined
        ? undefined
        : async (objectKeys) => {
            try {
              await assetStore.deleteObjects(objectKeys)
            } catch (error) {
              context.logger.error(
                {
                  error,
                  objectCount: objectKeys.length,
                },
                "admin.resource-library.asset-delete.failed"
              )
            }
          },
    searchService: createResourceSearchUseCase(
      createDrizzleResourceSearchRepository(context.database)
    ),
    sessionResolver: context.sessionResolver,
    treeService: createResourceTreeUseCase({
      createDocumentId,
      createFolderId: () =>
        toResourceFolderId(`resource-folder-${crypto.randomUUID()}`),
      treeRepository: createDrizzleResourceTreeRepository(context.database),
    }),
  })
}
