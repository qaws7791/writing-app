import {
  adminDeleteUserResultSchema,
  adminDashboardDtoSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
  type AdminDashboardDto,
  type AdminDeleteUserResultDto,
  type AdminUserDetailDto,
  type AdminUserListDto,
} from "@workspace/core/admin/admin.dto"
import type {
  AdminRepository,
  DeleteAdminUserInput,
  ReadAdminDashboardInput,
  ReadAdminUserInput,
  ReadAdminUsersInput,
  UpdateAdminUserStatusInput,
} from "@workspace/core/admin/admin.repository"

export type AdminService = {
  readonly deleteUser: (
    input: DeleteAdminUserInput
  ) => Promise<AdminDeleteUserResultDto | null>
  readonly getDashboard: (
    input: ReadAdminDashboardInput
  ) => Promise<AdminDashboardDto>
  readonly getUser: (
    input: ReadAdminUserInput
  ) => Promise<AdminUserDetailDto | null>
  readonly getUsers: (input: ReadAdminUsersInput) => Promise<AdminUserListDto>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<AdminUserDetailDto | null>
}

export function createAdminService(repository: AdminRepository): AdminService {
  return {
    async deleteUser(input) {
      return adminDeleteUserResultSchema
        .nullable()
        .parse(await repository.deleteUser(input))
    },
    async getDashboard(input) {
      return adminDashboardDtoSchema.parse(
        await repository.readDashboard(input)
      )
    },
    async getUser(input) {
      return adminUserDetailDtoSchema
        .nullable()
        .parse(await repository.readUser(input))
    },
    async getUsers(input) {
      return adminUserListDtoSchema.parse(await repository.readUsers(input))
    },
    async updateUserStatus(input) {
      return adminUserDetailDtoSchema
        .nullable()
        .parse(await repository.updateUserStatus(input))
    },
  }
}
