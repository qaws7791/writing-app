import type { AdminUserDetailDto } from "@workspace/contracts/admin/identity-data"

import type {
  AdminUserMutationRepository,
  DeleteAdminUserInput,
  UpdateAdminUserStatusInput,
} from "#core/modules/auth/application/ports/admin-user-mutation.repository"
import {
  authorizeOwnerMutation,
  type OwnerAdminCommand,
} from "#core/shared/admin-owner-authorization"

export type AdminUserDeleteResult =
  | { readonly kind: "forbidden" }
  | { readonly kind: "not-found" }
  | { readonly kind: "ok" }

export type AdminUserStatusUpdateResult =
  | { readonly kind: "forbidden" }
  | { readonly kind: "not-found" }
  | { readonly kind: "ok"; readonly value: AdminUserDetailDto }

export type AdminUserMutationUseCase = {
  readonly deleteUser: (
    input: OwnerAdminCommand<DeleteAdminUserInput>
  ) => Promise<AdminUserDeleteResult>
  readonly updateUserStatus: (
    input: OwnerAdminCommand<UpdateAdminUserStatusInput>
  ) => Promise<AdminUserStatusUpdateResult>
}

export function createAdminUserMutationUseCase(
  userMutationRepository: AdminUserMutationRepository
): AdminUserMutationUseCase {
  return {
    async deleteUser({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      return userMutationRepository.deleteUser(input)
    },
    async updateUserStatus({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      return userMutationRepository.updateUserStatus(input)
    },
  }
}
