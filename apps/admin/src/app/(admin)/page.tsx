import { AdminDashboardPage } from "@/features/dashboard/admin-dashboard-page"
import { createAdminAnalyticsApi } from "@/features/analytics/admin-analytics-api"
import { createAdminDashboardApi } from "@/features/dashboard/admin-dashboard-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminDashboardRoute() {
  const transport = getServerAdminHttpTransport({
    tokenProvider: getServerAdminSessionToken,
  })
  const analyticsApi = createAdminAnalyticsApi(transport)
  const dashboardApi = createAdminDashboardApi(transport)
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
