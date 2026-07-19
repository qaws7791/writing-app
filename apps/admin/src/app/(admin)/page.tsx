import { AdminDashboardPage } from "@/features/dashboard/ui/admin-dashboard-page"
import { createAdminAnalyticsDal } from "@/features/analytics/server/admin-analytics-dal"
import { createAdminDashboardDal } from "@/features/dashboard/server/admin-dashboard-dal"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"

export default async function AdminDashboardRoute() {
  const transport = getServerAdminHttpTransport({
    tokenProvider: getServerAdminSessionToken,
  })
  const analyticsApi = createAdminAnalyticsDal(transport)
  const dashboardApi = createAdminDashboardDal(transport)
  const [dashboardResult, analyticsResult] = await Promise.all([
    dashboardApi.getDashboard(),
    analyticsApi.getAnalytics({ days: 30 }),
  ])

  return (
    <AdminDashboardPage
      analyticsResult={analyticsResult}
      dashboardResult={dashboardResult}
    />
  )
}
