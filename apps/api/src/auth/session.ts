import type { LearnerAccountStatus } from "@workspace/core/status"
export { readBearerToken } from "@workspace/core/auth"

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
