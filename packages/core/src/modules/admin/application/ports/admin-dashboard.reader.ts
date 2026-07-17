import type { AdminDashboardDto } from "@workspace/contracts/admin/dashboard-analytics-data"

export type ReadAdminDashboardInput = {
  readonly now: Date
}

export type AdminDashboardReader = {
  readonly readDashboard: (
    input: ReadAdminDashboardInput
  ) => Promise<AdminDashboardDto>
}
