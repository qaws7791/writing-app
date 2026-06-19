import {
  adminDeleteUserResultSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
  type AdminDeleteUserResultDto,
  type AdminUserDetailDto,
  type AdminUserListDto,
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  DeleteAdminUserInput,
  ReadAdminUserInput,
  ReadAdminUsersInput,
  UpdateAdminUserStatusInput,
  UserAdminRepository,
} from "@workspace/core/modules/admin/application/ports/admin.repository"

export type AdminUserUseCase = {
  readonly deleteUser: (
    input: DeleteAdminUserInput
  ) => Promise<AdminDeleteUserResultDto | null>
  readonly getUser: (
    input: ReadAdminUserInput
  ) => Promise<AdminUserDetailDto | null>
  readonly getUsers: (input: ReadAdminUsersInput) => Promise<AdminUserListDto>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<AdminUserDetailDto | null>
}

export function createAdminUserUseCase(
  userRepository: UserAdminRepository
): AdminUserUseCase {
  return {
    async deleteUser(input) {
      return adminDeleteUserResultSchema
        .nullable()
        .parse(await userRepository.deleteUser(input))
    },
    async getUser(input) {
      return adminUserDetailDtoSchema
        .nullable()
        .parse(await userRepository.readUser(input))
    },
    async getUsers(input) {
      return adminUserListDtoSchema.parse(await userRepository.readUsers(input))
    },
    async updateUserStatus(input) {
      return adminUserDetailDtoSchema
        .nullable()
        .parse(await userRepository.updateUserStatus(input))
    },
  }
}
