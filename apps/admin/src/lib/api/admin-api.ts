import type {
  AdminAnalyticsDto,
  AdminArchiveCourseResultDto,
  AdminContentResetResultDto,
  AdminCourseDetailDto,
  AdminCourseListStatusFilter,
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
} from "@workspace/core/admin"

import type { ContentStatus } from "@workspace/core/status"
import type { AdminApiResult } from "@/lib/api/api-result"

export type AdminCourseStatusFilter = AdminCourseListStatusFilter

export type AdminCourseListItem = {
  readonly category: string
  readonly id: string
  readonly lessonCount: number
  readonly revision: number
  readonly status: ContentStatus
  readonly title: string
  readonly unitCount: number
}

export type AdminCourseList = {
  readonly items: readonly AdminCourseListItem[]
  readonly pagination: {
    readonly page: number
    readonly pageSize: number
    readonly totalItems: number
    readonly totalPages: number
  }
}

export type ReadAdminCoursesInput = {
  readonly category: string
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: AdminCourseStatusFilter
}

export type ReadAdminUsersInput = {
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminUserSort
  readonly status: AdminUserListStatusFilter
}

export type ReadAdminAnalyticsInput = {
  readonly days: number
}

export type ReadAdminLessonAnalyticsInput = {
  readonly direction: AdminSortDirection
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminLessonAnalyticsSort
}

export type UpdateAdminUserStatusInput = AdminUpdateUserStatusRequest & {
  readonly userId: string
}

export type AdminApi = {
  readonly archiveCourse: (
    courseId: string
  ) => Promise<AdminApiResult<AdminArchiveCourseResultDto>>
  readonly createCourse: () => Promise<AdminApiResult<AdminCourseDetailDto>>
  readonly deleteUser: (
    userId: string
  ) => Promise<AdminApiResult<AdminDeleteUserResultDto>>
  readonly getAnalytics: (
    input: ReadAdminAnalyticsInput
  ) => Promise<AdminApiResult<AdminAnalyticsDto>>
  readonly getCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminApiResult<AdminCourseList>>
  readonly getCourseEditor: (
    courseId: string
  ) => Promise<AdminApiResult<AdminCourseDetailDto>>
  readonly getDashboard: () => Promise<AdminApiResult<AdminDashboardDto>>
  readonly getLessonAnalytics: (
    input: ReadAdminLessonAnalyticsInput
  ) => Promise<AdminApiResult<AdminLessonAnalyticsPageDto>>
  readonly getSettings: () => Promise<AdminApiResult<AdminSettingsDto>>
  readonly getUser: (
    userId: string
  ) => Promise<AdminApiResult<AdminUserDetailDto>>
  readonly getUsers: (
    input: ReadAdminUsersInput
  ) => Promise<AdminApiResult<AdminUserListDto>>
  readonly resetContent: () => Promise<
    AdminApiResult<AdminContentResetResultDto>
  >
  readonly saveLegalSettings: (
    input: AdminLegalSettingsRequest
  ) => Promise<AdminApiResult<AdminSettingsDto>>
  readonly saveNoticeSettings: (
    input: AdminNoticeSettingsRequest
  ) => Promise<AdminApiResult<AdminSettingsDto>>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<AdminApiResult<AdminUserDetailDto>>
}
