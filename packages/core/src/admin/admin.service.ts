import {
  adminAnalyticsDtoSchema,
  adminDeleteUserResultSchema,
  adminDashboardDtoSchema,
  adminLessonAnalyticsPageDtoSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
  type AdminAnalyticsDto,
  type AdminDashboardDto,
  type AdminDeleteUserResultDto,
  type AdminLessonAnalyticsPageDto,
  type AdminUserDetailDto,
  type AdminUserListDto,
} from "@workspace/core/admin/admin.dto"
import type {
  AdminRepository,
  DeleteAdminUserInput,
  ReadAdminAnalyticsInput,
  ReadAdminDashboardInput,
  ReadAdminLessonAnalyticsInput,
  ReadAdminUserInput,
  ReadAdminUsersInput,
  UpdateAdminUserStatusInput,
} from "@workspace/core/admin/admin.repository"

export type AdminService = {
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
