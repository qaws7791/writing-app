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
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  AnalyticsReader,
  ArchiveAdminCourseInput,
  ContentResetRepository,
  CourseAdminRepository,
  CreateAdminCourseInput,
  DashboardReader,
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
  SettingsRepository,
  UpdateAdminUserStatusInput,
  UserAdminRepository,
} from "@workspace/core/modules/admin/application/ports/admin.repository"

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

export type AdminServicePorts = {
  readonly analyticsReader: AnalyticsReader
  readonly contentResetRepository: ContentResetRepository
  readonly courseRepository: CourseAdminRepository
  readonly dashboardReader: DashboardReader
  readonly settingsRepository: SettingsRepository
  readonly userRepository: UserAdminRepository
}

export function createAdminService(ports: AdminServicePorts): AdminService {
  return {
    async archiveCourse(input) {
      return adminArchiveCourseResultSchema
        .nullable()
        .parse(await ports.courseRepository.archiveCourse(input))
    },
    async createCourse(input) {
      return adminCourseDetailDtoSchema.parse(
        await ports.courseRepository.createCourse(input)
      )
    },
    async deleteUser(input) {
      return adminDeleteUserResultSchema
        .nullable()
        .parse(await ports.userRepository.deleteUser(input))
    },
    async getAnalytics(input) {
      return adminAnalyticsDtoSchema.parse(
        await ports.analyticsReader.readAnalytics(input)
      )
    },
    async getDashboard(input) {
      return adminDashboardDtoSchema.parse(
        await ports.dashboardReader.readDashboard(input)
      )
    },
    async getLessonAnalytics(input) {
      return adminLessonAnalyticsPageDtoSchema.parse(
        await ports.analyticsReader.readLessonAnalytics(input)
      )
    },
    async getCourseEditor(input) {
      return adminCourseDetailDtoSchema
        .nullable()
        .parse(await ports.courseRepository.readCourseEditor(input))
    },
    async getCourses(input) {
      return adminCourseListDtoSchema.parse(
        await ports.courseRepository.readCourses(input)
      )
    },
    async getSettings() {
      return adminSettingsDtoSchema.parse(
        await ports.settingsRepository.readSettings()
      )
    },
    async getUser(input) {
      return adminUserDetailDtoSchema
        .nullable()
        .parse(await ports.userRepository.readUser(input))
    },
    async getUsers(input) {
      return adminUserListDtoSchema.parse(
        await ports.userRepository.readUsers(input)
      )
    },
    async resetContent(input) {
      return adminContentResetResultSchema.parse(
        await ports.contentResetRepository.resetContent(input)
      )
    },
    async updateLegalSettings(input) {
      return adminSettingsDtoSchema.parse(
        await ports.settingsRepository.saveLegalSettings(input)
      )
    },
    async updateNoticeSettings(input) {
      return adminSettingsDtoSchema.parse(
        await ports.settingsRepository.saveNoticeSettings(input)
      )
    },
    async updateUserStatus(input) {
      return adminUserDetailDtoSchema
        .nullable()
        .parse(await ports.userRepository.updateUserStatus(input))
    },
  }
}
