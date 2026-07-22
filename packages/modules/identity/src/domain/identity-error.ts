import type { AdminRole } from "#identity/domain/admin-role"
import type { UserStatus } from "#identity/domain/user-status"

export type IdentityError =
  | { readonly kind: "identity-conflict" }
  | { readonly kind: "identity-deleted" }
  | { readonly kind: "identity-forbidden" }
  | {
      readonly from: AdminRole
      readonly kind: "identity-invalid-role-transition"
      readonly to: AdminRole
    }
  | {
      readonly from: UserStatus
      readonly kind: "identity-invalid-status-transition"
      readonly to: UserStatus
    }
  | { readonly kind: "identity-invalid-profile" }
  | { readonly kind: "identity-not-found" }
  | { readonly kind: "identity-session-revocation-failed" }
