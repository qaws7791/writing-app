import { createAdminUserMutationUseCase } from "@workspace/core/auth"

import { createAdminUserRepository } from "@/adapters/identity/admin-user-drizzle.repository"
import type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"
import type { AdminRouteGroup } from "@/http/admin-route-group"
import { createAdminIdentityRoutes } from "@/modules/admin-identity/admin-identity.routes"

export function composeAdminIdentityRouteGroup(
  context: AdminRouteCompositionContext
): AdminRouteGroup {
  const identityRepository = createAdminUserRepository(context.database)

  return createAdminIdentityRoutes({
    now: context.now,
    sessionResolver: context.sessionResolver,
    userMutationService: createAdminUserMutationUseCase(identityRepository),
    userReader: identityRepository,
  })
}
