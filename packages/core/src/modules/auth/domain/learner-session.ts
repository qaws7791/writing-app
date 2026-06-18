import type { LearnerAccountStatus } from "@workspace/core/shared/kernel/status"

export type { LearnerAccountStatus } from "@workspace/core/shared/kernel/status"

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
    headers: Headers
  ) => Promise<AuthenticatedSession | null>
}
