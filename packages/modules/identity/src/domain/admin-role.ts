import type { AdminId } from "@workspace/types/ids"
import { err, ok, type Result } from "@workspace/kernel/result"

import type { IdentityError } from "#identity/domain/identity-error"

export const adminRoles = Object.freeze({
  operator: "operator",
  owner: "owner",
} as const)

export const adminRoleValues = Object.freeze([
  adminRoles.owner,
  adminRoles.operator,
] as const)

export type AdminRole = (typeof adminRoleValues)[number]

export type AdminActor = Readonly<{
  id: AdminId
  role: AdminRole
}>

export type OwnerAdminCommand<TInput> = Readonly<TInput> & {
  readonly actor: AdminActor
}

export type AdminOwnerMutationResult<TValue> =
  | { readonly kind: "forbidden" }
  | { readonly kind: "not-found" }
  | { readonly kind: "ok"; readonly value: TValue }

export type AdminIdentity = Readonly<{
  id: AdminId
  role: AdminRole
}>

export function parseAdminRole(role: unknown): AdminRole | null {
  return adminRoleValues.some((candidate) => candidate === role)
    ? (role as AdminRole)
    : null
}

export function canAccessOwnerAdminRoute(role: AdminRole): boolean {
  return role === adminRoles.owner
}

export function authorizeOwnerMutation(
  actor: AdminActor
): "allowed" | "forbidden" {
  return canAccessOwnerAdminRoute(actor.role) ? "allowed" : "forbidden"
}

export function decideAdminRoleChange(input: {
  readonly actor: AdminActor
  readonly identity: AdminIdentity
  readonly role: AdminRole
}): Result<AdminIdentity, IdentityError> {
  if (authorizeOwnerMutation(input.actor) === "forbidden") {
    return err({ kind: "identity-forbidden" })
  }
  if (
    input.actor.id === input.identity.id &&
    input.identity.role === adminRoles.owner &&
    input.role !== adminRoles.owner
  ) {
    return err({ kind: "identity-forbidden" })
  }
  if (input.identity.role === input.role) {
    return err({
      from: input.identity.role,
      kind: "identity-invalid-role-transition",
      to: input.role,
    })
  }

  return ok(Object.freeze({ ...input.identity, role: input.role }))
}
