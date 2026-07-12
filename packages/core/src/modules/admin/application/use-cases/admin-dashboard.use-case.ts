import {
  adminDashboardDtoSchema,
  type AdminDashboardDto,
} from "#core/modules/admin/domain/admin.dto"
import type {
  DashboardReader,
  ReadAdminDashboardInput,
} from "#core/modules/admin/application/ports/admin.repository"

export type AdminDashboardUseCase = {
  readonly getDashboard: (
    input: ReadAdminDashboardInput
  ) => Promise<AdminDashboardDto>
}

export function createAdminDashboardUseCase(
  dashboardReader: DashboardReader
): AdminDashboardUseCase {
  return {
    async getDashboard(input) {
      return adminDashboardDtoSchema.parse(
        await dashboardReader.readDashboard(input)
      )
    },
  }
}
