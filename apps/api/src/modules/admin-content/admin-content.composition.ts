import type { ContentAdminSessionPort } from "@workspace/content/ports"
import { authorizeOwnerMutation } from "@workspace/identity/admin-actor"

import type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"
import type { AdminRouteGroup } from "@/http/admin-route-group"

export function composeAdminContentRouteGroup(
  context: AdminRouteCompositionContext
): AdminRouteGroup {
  return context.content.createAdminRoutes(
    createContentAdminSessionPort(context)
  )
}

function createContentAdminSessionPort(
  context: Pick<AdminRouteCompositionContext, "sessionResolver">
): ContentAdminSessionPort {
  return {
    async resolveActor(headers) {
      const session = await context.sessionResolver.resolveSession(headers)
      if (session === null) return null

      const actor = { id: session.admin.id, role: session.admin.role }
      return {
        adminId: session.admin.id,
        mutation:
          authorizeOwnerMutation(actor) === "allowed" ? "allowed" : "forbidden",
      }
    },
  }
}
