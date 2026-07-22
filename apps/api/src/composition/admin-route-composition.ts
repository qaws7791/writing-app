import {
  assembleAdminCapabilityRoutes,
  createAdminRouteGroupRegistry,
} from "@/http/admin-route-registry"
import type {
  AdminRouteGroup,
  AdminRouteGroupRegistry,
} from "@/http/admin-route-group"
import { composeAdminContentRouteGroup } from "@/modules/admin-content/admin-content.composition"
import { composeAdminIdentityRouteGroup } from "@/modules/admin-identity/admin-identity.composition"
import type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"
import { createResourceAdminSessionPort } from "@/composition/resource-library-module.composition"
import {
  composeOperationsModule,
  createOperationsAdminSessionPort,
} from "@/composition/operations-module.composition"

export type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"

export function createAdminCapabilityRouteGroupRegistry(
  context: AdminRouteCompositionContext
): AdminRouteGroupRegistry {
  const operations = composeOperationsModule(context)
  return createAdminRouteGroupRegistry({
    content: composeAdminContentRouteGroup(context),
    identity: composeAdminIdentityRouteGroup(context),
    operations: operations.createAdminRoutes(
      createOperationsAdminSessionPort(context.sessionResolver)
    ),
    resourceLibrary: context.resourceLibrary.createAdminRoutes(
      createResourceAdminSessionPort(context.sessionResolver)
    ),
  })
}

export function createAdminCapabilityRoutes(
  context: AdminRouteCompositionContext
): AdminRouteGroup {
  return assembleAdminCapabilityRoutes(
    createAdminCapabilityRouteGroupRegistry(context)
  )
}
