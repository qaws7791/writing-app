import type { UserStatus } from "#identity/domain/user-status"

export type IdentityError =
  | { readonly kind: "identity-deletion-marker-failed" }
  | { readonly kind: "identity-conflict" }
  | { readonly kind: "identity-deleted" }
  | {
      readonly from: UserStatus
      readonly kind: "identity-invalid-status-transition"
      readonly to: UserStatus
    }
  | { readonly kind: "identity-invalid-profile" }
  | { readonly kind: "identity-not-found" }
  | { readonly kind: "identity-session-revocation-failed" }
