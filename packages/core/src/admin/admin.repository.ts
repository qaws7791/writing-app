import type {
  AdminAnalyticsDto,
  AdminContentResetResultDto,
  AdminDashboardDto,
  AdminDeleteUserResultDto,
  AdminLegalSettingsRequest,
  AdminLessonAnalyticsPageDto,
  AdminLessonAnalyticsSort,
  AdminNoticeSettingsRequest,
  AdminSettingsDto,
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

export type SaveAdminNoticeSettingsInput = AdminNoticeSettingsRequest & {
  readonly now: Date
}

export type SaveAdminLegalSettingsInput = AdminLegalSettingsRequest & {
  readonly now: Date
}

export type ResetAdminContentInput = {
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
  readonly readAnalytics: (
    input: ReadAdminAnalyticsInput
  ) => Promise<AdminAnalyticsDto>
  readonly readDashboard: (
    input: ReadAdminDashboardInput
  ) => Promise<AdminDashboardDto>
  readonly readLessonAnalytics: (
    input: ReadAdminLessonAnalyticsInput
  ) => Promise<AdminLessonAnalyticsPageDto>
  readonly readSettings: () => Promise<AdminSettingsDto>
  readonly readUser: (
    input: ReadAdminUserInput
  ) => Promise<AdminUserDetailDto | null>
  readonly readUsers: (input: ReadAdminUsersInput) => Promise<AdminUserListDto>
  readonly resetContent: (
    input: ResetAdminContentInput
  ) => Promise<AdminContentResetResultDto>
  readonly saveLegalSettings: (
    input: SaveAdminLegalSettingsInput
  ) => Promise<AdminSettingsDto>
  readonly saveNoticeSettings: (
    input: SaveAdminNoticeSettingsInput
  ) => Promise<AdminSettingsDto>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<AdminUserDetailDto | null>
}

export type AdminDashboardRepository = Pick<AdminRepository, "readDashboard">
