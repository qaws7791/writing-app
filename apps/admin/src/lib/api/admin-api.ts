import type {
  AdminAnalyticsDto,
  AdminArchiveCourseResultDto,
  AdminContentResetResultDto,
  AdminCourseDetailDto,
  AdminCourseListStatusFilter,
  AdminDashboardDto,
  AdminDeleteUserResultDto,
  AdminLegalSettingsRequest as AdminLegalSettingsWireRequest,
  AdminLessonAnalyticsPageDto,
  AdminLessonAnalyticsSort,
  AdminNoticeSettingsRequest as AdminNoticeSettingsWireRequest,
  AdminSettingsDto,
  AdminSortDirection,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUserListStatusFilter,
  AdminUserSort,
  AdminUpdateUserStatusRequest,
} from "@workspace/contracts/admin"

import type { ContentStatus } from "@workspace/contracts/status"
import type { AdminApiResult } from "@/lib/api/api-result"

export type AdminAnalytics = AdminAnalyticsDto
export type AdminArchiveCourseResult = AdminArchiveCourseResultDto
export type AdminContentResetResult = AdminContentResetResultDto
export type AdminCourseDetail = AdminCourseDetailDto
export type AdminCourseStatusFilter = AdminCourseListStatusFilter
export type AdminDashboard = AdminDashboardDto
export type AdminDeleteUserResult = AdminDeleteUserResultDto
export type AdminLegalSettingsRequest = AdminLegalSettingsWireRequest
export type AdminLessonAnalyticsPage = AdminLessonAnalyticsPageDto
export type AdminNoticeSettingsRequest = AdminNoticeSettingsWireRequest
export type AdminSettings = AdminSettingsDto
export type AdminUserDetail = AdminUserDetailDto
export type AdminUserList = AdminUserListDto

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
  ) => Promise<AdminApiResult<AdminArchiveCourseResult>>
  readonly createCourse: () => Promise<AdminApiResult<AdminCourseDetail>>
  readonly deleteUser: (
    userId: string
  ) => Promise<AdminApiResult<AdminDeleteUserResult>>
  readonly getAnalytics: (
    input: ReadAdminAnalyticsInput
  ) => Promise<AdminApiResult<AdminAnalytics>>
  readonly getCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminApiResult<AdminCourseList>>
  readonly getCourseEditor: (
    courseId: string
  ) => Promise<AdminApiResult<AdminCourseDetail>>
  readonly getDashboard: () => Promise<AdminApiResult<AdminDashboard>>
  readonly getLessonAnalytics: (
    input: ReadAdminLessonAnalyticsInput
  ) => Promise<AdminApiResult<AdminLessonAnalyticsPage>>
  readonly getSettings: () => Promise<AdminApiResult<AdminSettings>>
  readonly getUser: (userId: string) => Promise<AdminApiResult<AdminUserDetail>>
  readonly getUsers: (
    input: ReadAdminUsersInput
  ) => Promise<AdminApiResult<AdminUserList>>
  readonly resetContent: () => Promise<AdminApiResult<AdminContentResetResult>>
  readonly saveLegalSettings: (
    input: AdminLegalSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
  readonly saveNoticeSettings: (
    input: AdminNoticeSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<AdminApiResult<AdminUserDetail>>
}
