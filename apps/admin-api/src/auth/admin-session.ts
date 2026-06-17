import type { AdminRole } from "@workspace/core/admin"

export type { AdminRole } from "@workspace/core/admin"

export type AdminAuthenticatedSession = {
  readonly admin: {
    readonly email: string
    readonly id: string
    readonly name: string
    readonly role: AdminRole
  }
}

export type AdminSessionResolver = {
  readonly resolveSession: (
    headers: Headers
  ) => Promise<AdminAuthenticatedSession | null>
}
