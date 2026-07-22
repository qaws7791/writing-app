import type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"
import type { AdminRouteGroup } from "@/http/admin-route-group"

export function composeAdminIdentityRouteGroup(
  context: AdminRouteCompositionContext
): AdminRouteGroup {
  return context.identity.createAdminRoutes(context.sessionResolver)
}
