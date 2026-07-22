import "server-only"

import type { AdminApiResult } from "@/shared/http/admin-api-result"
import type { AdminHttpTransport } from "@/shared/http/admin-http-transport"
import { adminDashboardDtoSchema } from "@workspace/contracts/operations/admin-dashboard"
import type { AdminDashboard } from "@/features/dashboard/model/admin-dashboard"

export type AdminDashboardDal = {
  readonly getDashboard: () => Promise<AdminApiResult<AdminDashboard>>
}

export function createAdminDashboardDal(
  transport: AdminHttpTransport
): AdminDashboardDal {
  return {
    async getDashboard() {
      return transport.requestJson({
        method: "GET",
        path: "/api/admin/dashboard",
        schema: adminDashboardDtoSchema,
      })
    },
  }
}
