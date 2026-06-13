import type {
  AdminAnalyticsDto,
  AdminDashboardDto,
  AdminDeleteUserResultDto,
  AdminLessonAnalyticsPageDto,
  AdminLessonAnalyticsSort,
  AdminSortDirection,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUserListStatusFilter,
  AdminUserSort,
  AdminUpdateUserStatusRequest,
} from "@workspace/core/admin/admin.dto"

export type ReadAdminDashboardInput = {
  readonly now: Date
}

export type ReadAdminAnalyticsInput = {
  readonly days: number
  readonly now: Date
}

export type ReadAdminLessonAnalyticsInput = {
  readonly direction: AdminSortDirection
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminLessonAnalyticsSort
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
  readonly readAnalytics: (
    input: ReadAdminAnalyticsInput
  ) => Promise<AdminAnalyticsDto>
  readonly readDashboard: (
    input: ReadAdminDashboardInput
  ) => Promise<AdminDashboardDto>
  readonly readLessonAnalytics: (
    input: ReadAdminLessonAnalyticsInput
  ) => Promise<AdminLessonAnalyticsPageDto>
  readonly readUser: (
    input: ReadAdminUserInput
  ) => Promise<AdminUserDetailDto | null>
  readonly readUsers: (input: ReadAdminUsersInput) => Promise<AdminUserListDto>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<AdminUserDetailDto | null>
}

export type AdminDashboardRepository = Pick<AdminRepository, "readDashboard">
