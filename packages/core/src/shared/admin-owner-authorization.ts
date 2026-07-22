import {
  adminRoles,
  type AdminId,
  type AdminRole,
} from "@workspace/contracts/identity/data"

export type AdminActor = {
  readonly id: AdminId
  readonly role: AdminRole
}

export type OwnerAdminCommand<TInput> = TInput & {
  readonly actor: AdminActor
}

export type AdminOwnerMutationResult<TValue> =
  | { readonly kind: "forbidden" }
  | { readonly kind: "not-found" }
  | { readonly kind: "ok"; readonly value: TValue }

export function authorizeOwnerMutation(
  actor: AdminActor
): "allowed" | "forbidden" {
  return actor.role === adminRoles.owner ? "allowed" : "forbidden"
}
