import { AdminDashboardPage } from "@/features/dashboard/ui/admin-dashboard-page"
import {
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import { getAdminDashboard } from "@workspace/http-client/admin"

export default async function AdminDashboardRoute() {
  const requestOptions = await getServerAdminRequestOptions()
  const dashboardResult =
    requestOptions === null
      ? unauthenticatedAdminRequestFailure()
      : await settleAdminApiRequest(getAdminDashboard(requestOptions))

  return <AdminDashboardPage dashboardResult={dashboardResult} />
}
