import type { LearnerAccountStatus } from "@workspace/core/status"

export type { LearnerAccountStatus } from "@workspace/core/status"

export type AuthenticatedSession = {
  readonly user: {
    readonly email: string
    readonly id: string
    readonly image: string | null
    readonly joinedAt: string
    readonly name: string
    readonly status: LearnerAccountStatus
  }
}

export type SessionResolver = {
  readonly resolveSession: (
    token: string
  ) => Promise<AuthenticatedSession | null>
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
