export { readBearerToken } from "@workspace/core/auth"

export type AdminRole = "operator" | "owner"

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
    token: string
  ) => Promise<AdminAuthenticatedSession | null>
}
