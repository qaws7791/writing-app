import type { AdminRole } from "@workspace/core/modules/admin/domain/admin-role"

export type AdminActor = {
  readonly authenticationAssurance:
    | "mfa-enrollment-required"
    | "mfa-step-up-required"
    | "mfa-step-up-verified"
    | "password"
  readonly id: string
  readonly role: AdminRole
}

export type OwnerAdminCommand<TInput> = TInput & {
  readonly actor: AdminActor
}

export type AdminOwnerMutationResult<TValue> =
  | { readonly kind: "forbidden" }
  | { readonly kind: "mfa-enrollment-required" }
  | { readonly kind: "not-found" }
  | { readonly kind: "ok"; readonly value: TValue }
  | { readonly kind: "step-up-required" }

export function authorizeOwnerMutation(
  actor: AdminActor
): "allowed" | "forbidden" | "mfa-enrollment-required" | "step-up-required" {
  if (actor.role !== "owner") return "forbidden"
  if (actor.authenticationAssurance === "mfa-enrollment-required") {
    return "mfa-enrollment-required"
  }
  if (actor.authenticationAssurance !== "mfa-step-up-verified") {
    return "step-up-required"
  }

  return "allowed"
}
