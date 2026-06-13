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

export function readBearerToken(
  authorizationHeader: string | null
): string | null {
  if (authorizationHeader === null) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(" ")

  if (scheme !== "Bearer" || token === undefined || token.length === 0) {
    return null
  }

  return token
}
