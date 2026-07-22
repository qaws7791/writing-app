import type { AdminDashboardDto } from "@workspace/contracts/operations/dashboard-analytics-data"

export type ReadAdminDashboardInput = {
  readonly now: Date
}

export type AdminDashboardReader = {
  readonly readDashboard: (
    input: ReadAdminDashboardInput
  ) => Promise<AdminDashboardDto>
}
