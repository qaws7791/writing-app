import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import {
  adminDashboardDtoSchema,
  type AdminDashboardDto,
} from "@workspace/contracts/admin"

export type AdminDashboard = AdminDashboardDto

export type AdminDashboardApi = {
  readonly getDashboard: () => Promise<AdminApiResult<AdminDashboard>>
}

export function createAdminDashboardApi(
  transport: AdminHttpTransport
): AdminDashboardApi {
  return {
    async getDashboard() {
      return transport.requestJson({
        method: "GET",
        path: "/dashboard",
        schema: adminDashboardDtoSchema,
      })
    },
  }
}
