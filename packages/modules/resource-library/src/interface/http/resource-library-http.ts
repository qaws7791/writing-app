import type { AnyRouteConfig } from "@workspace/http-platform/core"

import type { ResourceAdminSessionPort } from "#resource-library/application/ports/resource-library-ports"
import type { ResourceAssetApplication } from "#resource-library/application/resource-asset-application"
import type { ResourceDocumentApplication } from "#resource-library/application/resource-document-application"
import type {
  ResourceDocumentQuery,
  ResourceSearchQuery,
} from "#resource-library/application/resource-library-queries"
import type { ResourceTreeApplication } from "#resource-library/application/resource-tree-application"
import { createResourceDocumentRoutes } from "#resource-library/interface/http/resource-document-routes"
import { createResourceSearchRoutes } from "#resource-library/interface/http/resource-search-routes"
import { createResourceTreeRoutes } from "#resource-library/interface/http/resource-tree-routes"

export type ResourceLibraryHttpRouteGroup = readonly Readonly<{
  handler: unknown
  route: AnyRouteConfig
}>[]

export function createResourceLibraryRoutes(input: {
  readonly assetApplication: ResourceAssetApplication
  readonly documentApplication: ResourceDocumentApplication
  readonly documentQuery: ResourceDocumentQuery
  readonly searchQuery: ResourceSearchQuery
  readonly sessionPort: ResourceAdminSessionPort
  readonly treeApplication: ResourceTreeApplication
}): ResourceLibraryHttpRouteGroup {
  return Object.freeze([
    ...createResourceTreeRoutes({
      application: input.treeApplication,
      sessionPort: input.sessionPort,
    }),
    ...createResourceDocumentRoutes({
      assetApplication: input.assetApplication,
      documentApplication: input.documentApplication,
      documentQuery: input.documentQuery,
      sessionPort: input.sessionPort,
    }),
    ...createResourceSearchRoutes({
      query: input.searchQuery,
      sessionPort: input.sessionPort,
    }),
  ])
}

export type { ResourceLibraryHonoEnv } from "#resource-library/interface/http/resource-library-http-auth"
