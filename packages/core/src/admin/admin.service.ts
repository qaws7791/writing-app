import {
  adminAnalyticsDtoSchema,
  adminArchiveCourseResultSchema,
  adminContentResetResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseListDtoSchema,
  adminDeleteUserResultSchema,
  adminDashboardDtoSchema,
  adminLessonAnalyticsPageDtoSchema,
  adminSettingsDtoSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
  type AdminAnalyticsDto,
  type AdminArchiveCourseResultDto,
  type AdminContentResetResultDto,
  type AdminCourseDetailDto,
  type AdminCourseListDto,
  type AdminDashboardDto,
  type AdminDeleteUserResultDto,
  type AdminLessonAnalyticsPageDto,
  type AdminSettingsDto,
  type AdminUserDetailDto,
  type AdminUserListDto,
} from "@workspace/core/admin/admin.dto"
import type {
  AdminRepository,
  ArchiveAdminCourseInput,
  CreateAdminCourseInput,
  DeleteAdminUserInput,
  ReadAdminAnalyticsInput,
  ReadAdminCourseInput,
  ReadAdminCoursesInput,
  ReadAdminDashboardInput,
  ReadAdminLessonAnalyticsInput,
  ReadAdminUserInput,
  ReadAdminUsersInput,
  ResetAdminContentInput,
  SaveAdminLegalSettingsInput,
  SaveAdminNoticeSettingsInput,
  UpdateAdminUserStatusInput,
} from "@workspace/core/admin/admin.repository"

export type AdminService = {
  readonly archiveCourse: (
    input: ArchiveAdminCourseInput
  ) => Promise<AdminArchiveCourseResultDto | null>
  readonly createCourse: (
    input: CreateAdminCourseInput
  ) => Promise<AdminCourseDetailDto>
  readonly deleteUser: (
    input: DeleteAdminUserInput
  ) => Promise<AdminDeleteUserResultDto | null>
  readonly getAnalytics: (
    input: ReadAdminAnalyticsInput
  ) => Promise<AdminAnalyticsDto>
  readonly getDashboard: (
    input: ReadAdminDashboardInput
  ) => Promise<AdminDashboardDto>
  readonly getLessonAnalytics: (
    input: ReadAdminLessonAnalyticsInput
  ) => Promise<AdminLessonAnalyticsPageDto>
  readonly getCourseEditor: (
    input: ReadAdminCourseInput
  ) => Promise<AdminCourseDetailDto | null>
  readonly getCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminCourseListDto>
  readonly getSettings: () => Promise<AdminSettingsDto>
  readonly getUser: (
    input: ReadAdminUserInput
  ) => Promise<AdminUserDetailDto | null>
  readonly getUsers: (input: ReadAdminUsersInput) => Promise<AdminUserListDto>
  readonly resetContent: (
    input: ResetAdminContentInput
  ) => Promise<AdminContentResetResultDto>
  readonly updateLegalSettings: (
    input: SaveAdminLegalSettingsInput
  ) => Promise<AdminSettingsDto>
  readonly updateNoticeSettings: (
    input: SaveAdminNoticeSettingsInput
  ) => Promise<AdminSettingsDto>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<AdminUserDetailDto | null>
}

export function createAdminService(repository: AdminRepository): AdminService {
  return {
    async archiveCourse(input) {
      return adminArchiveCourseResultSchema
        .nullable()
        .parse(await repository.archiveCourse(input))
    },
    async createCourse(input) {
      return adminCourseDetailDtoSchema.parse(
        await repository.createCourse(input)
      )
    },
    async deleteUser(input) {
      return adminDeleteUserResultSchema
        .nullable()
        .parse(await repository.deleteUser(input))
    },
    async getAnalytics(input) {
      return adminAnalyticsDtoSchema.parse(
        await repository.readAnalytics(input)
      )
    },
    async getDashboard(input) {
      return adminDashboardDtoSchema.parse(
        await repository.readDashboard(input)
      )
    },
    async getLessonAnalytics(input) {
      return adminLessonAnalyticsPageDtoSchema.parse(
        await repository.readLessonAnalytics(input)
      )
    },
    async getCourseEditor(input) {
      return adminCourseDetailDtoSchema
        .nullable()
        .parse(await repository.readCourseEditor(input))
    },
    async getCourses(input) {
      return adminCourseListDtoSchema.parse(await repository.readCourses(input))
    },
    async getSettings() {
      return adminSettingsDtoSchema.parse(await repository.readSettings())
    },
    async getUser(input) {
      return adminUserDetailDtoSchema
        .nullable()
        .parse(await repository.readUser(input))
    },
    async getUsers(input) {
      return adminUserListDtoSchema.parse(await repository.readUsers(input))
    },
    async resetContent(input) {
      return adminContentResetResultSchema.parse(
        await repository.resetContent(input)
      )
    },
    async updateLegalSettings(input) {
      return adminSettingsDtoSchema.parse(
        await repository.saveLegalSettings(input)
      )
    },
    async updateNoticeSettings(input) {
      return adminSettingsDtoSchema.parse(
        await repository.saveNoticeSettings(input)
      )
    },
    async updateUserStatus(input) {
      return adminUserDetailDtoSchema
        .nullable()
        .parse(await repository.updateUserStatus(input))
    },
  }
}
