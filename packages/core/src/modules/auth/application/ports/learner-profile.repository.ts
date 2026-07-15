import type { LearnerAccountStatus } from "#core/shared/kernel/status"

export type LearnerProfileRepository = {
  readonly ensureActiveProfile: (input: {
    readonly displayName: string
    readonly userId: string
  }) => Promise<void>
  readonly findProfileByUserId: (
    userId: string
  ) => Promise<{ readonly status: LearnerAccountStatus } | null>
}
