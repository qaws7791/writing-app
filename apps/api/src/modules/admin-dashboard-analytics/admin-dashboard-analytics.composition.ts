import type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"
import type { AdminRouteGroup } from "@/http/admin-route-group"
import { createAdminDashboardAnalyticsRoutes } from "@/modules/admin-dashboard-analytics/admin-dashboard-analytics.routes"
import { createAdminAnalyticsRepository } from "@/adapters/analytics/admin-analytics-drizzle.repository"
import { createAdminDashboardRepository } from "@/adapters/dashboard/admin-dashboard-drizzle.repository"

export function composeAdminDashboardAnalyticsRouteGroup(
  context: AdminRouteCompositionContext
): AdminRouteGroup {
  return createAdminDashboardAnalyticsRoutes({
    analyticsReader: createAdminAnalyticsRepository(context.database),
    dashboardReader: createAdminDashboardRepository(context.database),
    now: context.now,
    sessionResolver: context.sessionResolver,
  })
}
