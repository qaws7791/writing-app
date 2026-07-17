import type {
  AdminUserDetailDto,
  UserId,
} from "@workspace/contracts/admin/identity-data"
import type { LearnerOperationalStatus } from "@workspace/contracts/status"

export type DeleteAdminUserInput = {
  readonly now: Date
  readonly userId: UserId
}

export type DeleteAdminUserPersistenceResult =
  | { readonly kind: "not-found" }
  | { readonly kind: "ok" }

export type UpdateAdminUserStatusInput = {
  readonly now: Date
  readonly status: LearnerOperationalStatus
  readonly userId: UserId
}

export type UpdateAdminUserStatusPersistenceResult =
  | { readonly kind: "not-found" }
  | { readonly kind: "ok"; readonly value: AdminUserDetailDto }

export type AdminUserMutationRepository = {
  readonly deleteUser: (
    input: DeleteAdminUserInput
  ) => Promise<DeleteAdminUserPersistenceResult>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<UpdateAdminUserStatusPersistenceResult>
}
