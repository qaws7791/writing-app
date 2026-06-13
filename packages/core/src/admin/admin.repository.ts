import type { AdminDashboardDto } from "@workspace/core/admin/admin.dto"

export type ReadAdminDashboardInput = {
  readonly now: Date
}

export type AdminDashboardRepository = {
  readonly readDashboard: (
    input: ReadAdminDashboardInput
  ) => Promise<AdminDashboardDto>
}
