import { createAdminSettingsUseCase } from "@workspace/core/admin"

import { createAdminSettingsRepository } from "@/adapters/settings/admin-settings-drizzle.repository"
import type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"
import type { AdminRouteGroup } from "@/http/admin-route-group"
import { createAdminSettingsRoutes } from "@/modules/admin-settings/admin-settings.routes"

export function composeAdminSettingsRouteGroup(
  context: AdminRouteCompositionContext
): AdminRouteGroup {
  return createAdminSettingsRoutes({
    now: context.now,
    sessionResolver: context.sessionResolver,
    settingsService: createAdminSettingsUseCase(
      createAdminSettingsRepository(context.database)
    ),
  })
}
