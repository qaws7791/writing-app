import {
  assembleAdminCapabilityRoutes,
  createAdminRouteGroupRegistry,
} from "@/http/admin-route-registry"
import type {
  AdminRouteGroup,
  AdminRouteGroupRegistry,
} from "@/http/admin-route-group"
import { composeAdminContentRouteGroup } from "@/composition/content-routes.composition"
import { composeAdminIdentityRouteGroup } from "@/composition/identity-routes.composition"
import type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"
import { createResourceAdminSessionPort } from "@/composition/resource-library-module.composition"
import {
  composeOperationsModule,
  createOperationsAdminSessionPort,
} from "@/composition/operations-module.composition"
import type { OperationsModule } from "@workspace/operations/module"

export type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"

export function createAdminCapabilityRouteGroupRegistry(
  context: AdminRouteCompositionContext,
  operations: OperationsModule = composeOperationsModule(context)
): AdminRouteGroupRegistry {
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
  context: AdminRouteCompositionContext,
  operations?: OperationsModule
): AdminRouteGroup {
  return assembleAdminCapabilityRoutes(
    createAdminCapabilityRouteGroupRegistry(context, operations)
  )
}
