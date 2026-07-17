import type { AdminUserMutationRepository } from "#core/modules/auth/application/ports/admin-user-mutation.repository"
import type { AdminUserMutationUseCase } from "#core/modules/auth/application/use-cases/admin-user-mutation.use-case"
import type { AdminActor } from "#core/shared/admin-owner-authorization"

type Assert<TValue extends true> = TValue
type Equal<TLeft, TRight> = [TLeft] extends [TRight]
  ? [TRight] extends [TLeft]
    ? true
    : false
  : false
type RequiresActor<TCommand> = TCommand extends { readonly actor: AdminActor }
  ? true
  : false

export type AdminUserOwnerCommandsRequireActor = [
  Assert<
    Equal<keyof AdminUserMutationRepository, "deleteUser" | "updateUserStatus">
  >,
  Assert<
    Equal<keyof AdminUserMutationUseCase, "deleteUser" | "updateUserStatus">
  >,
  Assert<
    RequiresActor<Parameters<AdminUserMutationUseCase["updateUserStatus"]>[0]>
  >,
  Assert<RequiresActor<Parameters<AdminUserMutationUseCase["deleteUser"]>[0]>>,
]
