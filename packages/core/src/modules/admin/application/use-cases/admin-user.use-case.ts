import {
  adminDeleteUserResultSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
  type AdminDeleteUserResultDto,
  type AdminUserDetailDto,
  type AdminUserListDto,
} from "#core/modules/admin/domain/admin.dto"
import type {
  DeleteAdminUserInput,
  ReadAdminUserInput,
  ReadAdminUsersInput,
  UpdateAdminUserStatusInput,
  UserAdminRepository,
} from "#core/modules/admin/application/ports/admin.repository"
import {
  authorizeOwnerMutation,
  type AdminOwnerMutationResult,
  type OwnerAdminCommand,
} from "#core/modules/admin/application/policies/admin-actor-policy"

export type AdminUserUseCase = {
  readonly deleteUser: (
    input: OwnerAdminCommand<DeleteAdminUserInput>
  ) => Promise<AdminOwnerMutationResult<AdminDeleteUserResultDto>>
  readonly getUser: (
    input: ReadAdminUserInput
  ) => Promise<AdminUserDetailDto | null>
  readonly getUsers: (input: ReadAdminUsersInput) => Promise<AdminUserListDto>
  readonly updateUserStatus: (
    input: OwnerAdminCommand<UpdateAdminUserStatusInput>
  ) => Promise<AdminOwnerMutationResult<AdminUserDetailDto>>
}

export function createAdminUserUseCase(
  userRepository: UserAdminRepository
): AdminUserUseCase {
  return {
    async deleteUser({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      const value = adminDeleteUserResultSchema
        .nullable()
        .parse(await userRepository.deleteUser(input))
      return value === null ? { kind: "not-found" } : { kind: "ok", value }
    },
    async getUser(input) {
      return adminUserDetailDtoSchema
        .nullable()
        .parse(await userRepository.readUser(input))
    },
    async getUsers(input) {
      return adminUserListDtoSchema.parse(await userRepository.readUsers(input))
    },
    async updateUserStatus({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      const value = adminUserDetailDtoSchema
        .nullable()
        .parse(await userRepository.updateUserStatus(input))
      return value === null ? { kind: "not-found" } : { kind: "ok", value }
    },
  }
}
