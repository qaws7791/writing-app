import {
  assembleAdminCapabilityRoutes,
  createAdminRouteGroupRegistry,
} from "@/http/admin-route-registry"
import type {
  AdminRouteGroup,
  AdminRouteGroupRegistry,
} from "@/http/admin-route-group"
import { composeAdminAiChatRouteGroup } from "@/modules/admin-ai-chat/admin-ai-chat.composition"
import { composeAdminContentRouteGroup } from "@/modules/admin-content/admin-content.composition"
import { composeAdminDashboardAnalyticsRouteGroup } from "@/modules/admin-dashboard-analytics/admin-dashboard-analytics.composition"
import { composeAdminIdentityRouteGroup } from "@/modules/admin-identity/admin-identity.composition"
import { composeAdminResourceLibraryRouteGroup } from "@/modules/admin-resource-library/admin-resource-library.composition"
import { composeAdminSettingsRouteGroup } from "@/modules/admin-settings/admin-settings.composition"
import type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"

export type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"

export function createAdminCapabilityRouteGroupRegistry(
  context: AdminRouteCompositionContext
): AdminRouteGroupRegistry {
  return createAdminRouteGroupRegistry({
    aiChat: composeAdminAiChatRouteGroup(context),
    dashboardAnalytics: composeAdminDashboardAnalyticsRouteGroup(context),
    content: composeAdminContentRouteGroup(context),
    identity: composeAdminIdentityRouteGroup(context),
    resourceLibrary: composeAdminResourceLibraryRouteGroup(context),
    settings: composeAdminSettingsRouteGroup(context),
  })
}

export function createAdminCapabilityRoutes(
  context: AdminRouteCompositionContext
): AdminRouteGroup {
  return assembleAdminCapabilityRoutes(
    createAdminCapabilityRouteGroupRegistry(context)
  )
}
