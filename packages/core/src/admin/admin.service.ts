import {
  adminDashboardDtoSchema,
  type AdminDashboardDto,
} from "@workspace/core/admin/admin.dto"
import type {
  AdminDashboardRepository,
  ReadAdminDashboardInput,
} from "@workspace/core/admin/admin.repository"

export type AdminService = {
  readonly getDashboard: (
    input: ReadAdminDashboardInput
  ) => Promise<AdminDashboardDto>
}

export function createAdminService(
  repository: AdminDashboardRepository
): AdminService {
  return {
    async getDashboard(input) {
      return adminDashboardDtoSchema.parse(
        await repository.readDashboard(input)
      )
    },
  }
}
