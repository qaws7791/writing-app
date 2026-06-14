import { AdminDashboardPage } from "@/features/dashboard/admin-dashboard-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminDashboardRoute() {
  const api = getServerAdminApi({
    tokenProvider: getServerAdminSessionToken,
  })
  const dashboardResult = await api.getDashboard()

  return <AdminDashboardPage dashboardResult={dashboardResult} />
}
