import type { AdminRole } from "@workspace/core/admin"

export type { AdminRole } from "@workspace/core/admin"

export const adminSessionExpiresAt = Symbol("admin-session-expires-at")

export type AdminAuthenticationAssurance =
  | "mfa-enrollment-required"
  | "mfa-step-up-required"
  | "mfa-step-up-verified"
  | "password"

export type AdminAuthenticatedSession = {
  readonly admin: {
    readonly email: string
    readonly id: string
    readonly name: string
    readonly role: AdminRole
    readonly twoFactorEnabled: boolean
  }
  readonly authenticationAssurance: AdminAuthenticationAssurance
  readonly [adminSessionExpiresAt]: Date
}

export type AdminSessionResolver = {
  readonly resolveSession: (
    headers: Headers
  ) => Promise<AdminAuthenticatedSession | null>
}
