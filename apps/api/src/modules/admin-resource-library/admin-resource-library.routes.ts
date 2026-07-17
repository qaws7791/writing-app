import {
  defineAdminRouteGroup,
  type AdminRouteGroup,
} from "@/http/admin-route-group"
import {
  createResourceDocumentsRoutes,
  type ResourceDocumentsRouteDependencies,
} from "@/modules/admin-resource-library/resource-documents.routes"
import {
  createResourceSearchRoutes,
  type ResourceSearchRouteDependencies,
} from "@/modules/admin-resource-library/resource-search.routes"
import {
  createResourceTreeRoutes,
  type ResourceTreeRouteDependencies,
} from "@/modules/admin-resource-library/resource-tree.routes"

export type AdminResourceLibraryRouteDependencies =
  ResourceTreeRouteDependencies &
    ResourceDocumentsRouteDependencies &
    ResourceSearchRouteDependencies

export function createAdminResourceLibraryRoutes(
  dependencies: AdminResourceLibraryRouteDependencies
): AdminRouteGroup {
  return defineAdminRouteGroup([
    ...createResourceTreeRoutes(dependencies),
    ...createResourceDocumentsRoutes(dependencies),
    ...createResourceSearchRoutes(dependencies),
  ])
}
