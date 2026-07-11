import type { AdminRole } from "@workspace/core/modules/admin/domain/admin-role"

export type AdminActor = {
  readonly id: string
  readonly role: AdminRole
}

export type OwnerAdminCommand<TInput> = TInput & {
  readonly actor: AdminActor
}

export type AdminOwnerMutationResult<TValue> =
  | { readonly kind: "forbidden" }
  | { readonly kind: "not-found" }
  | { readonly kind: "ok"; readonly value: TValue }

export function canExecuteOwnerMutation(actor: AdminActor): boolean {
  return actor.role === "owner"
}
