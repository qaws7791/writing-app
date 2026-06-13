import type {
  AdminDashboardDto,
  AdminDeleteUserResultDto,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUserListStatusFilter,
  AdminUserSort,
  AdminUpdateUserStatusRequest,
} from "@workspace/core/admin/admin.dto"

export type ReadAdminDashboardInput = {
  readonly now: Date
}

export type ReadAdminUsersInput = {
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminUserSort
  readonly status: AdminUserListStatusFilter
}

export type ReadAdminUserInput = {
  readonly userId: string
}

export type UpdateAdminUserStatusInput = {
  readonly now: Date
  readonly status: AdminUpdateUserStatusRequest["status"]
  readonly userId: string
}

export type DeleteAdminUserInput = {
  readonly now: Date
  readonly userId: string
}

export type AdminRepository = {
  readonly deleteUser: (
    input: DeleteAdminUserInput
  ) => Promise<AdminDeleteUserResultDto | null>
  readonly readDashboard: (
    input: ReadAdminDashboardInput
  ) => Promise<AdminDashboardDto>
  readonly readUser: (
    input: ReadAdminUserInput
  ) => Promise<AdminUserDetailDto | null>
  readonly readUsers: (input: ReadAdminUsersInput) => Promise<AdminUserListDto>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<AdminUserDetailDto | null>
}

export type AdminDashboardRepository = Pick<AdminRepository, "readDashboard">
