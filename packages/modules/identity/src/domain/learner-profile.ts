import { err, ok, type Result } from "@workspace/kernel/result"
import type { UserId } from "@workspace/types/ids"

import type { IdentityError } from "#identity/domain/identity-error"
import { userStatuses, type UserStatus } from "#identity/domain/user-status"

export const deletedLearnerDisplayName = "삭제된 사용자"
const learnerDisplayNameMaxLength = 200

export type LearnerProfile = Readonly<{
  deletedAt: Date | null
  displayName: string
  status: UserStatus
  userId: UserId
}>

export function createLearnerProfile(input: {
  readonly deletedAt?: Date | null
  readonly displayName: string
  readonly status?: UserStatus
  readonly userId: UserId
}): Result<LearnerProfile, IdentityError> {
  const status = input.status ?? userStatuses.active
  const displayName = input.displayName.trim()
  const deletedAt = input.deletedAt ?? null
  const hasValidDisplayName =
    displayName.length > 0 && displayName.length <= learnerDisplayNameMaxLength
  const hasConsistentDeletion =
    status === userStatuses.deleted
      ? deletedAt !== null && displayName === deletedLearnerDisplayName
      : deletedAt === null

  if (!hasValidDisplayName || !hasConsistentDeletion) {
    return err({ kind: "identity-invalid-profile" })
  }

  return ok(
    Object.freeze({
      deletedAt: deletedAt === null ? null : new Date(deletedAt),
      displayName,
      status,
      userId: input.userId,
    })
  )
}

export function changeLearnerDisplayName(input: {
  readonly displayName: string
  readonly profile: LearnerProfile
}): Result<LearnerProfile, IdentityError> {
  if (input.profile.status === userStatuses.deleted) {
    return err({ kind: "identity-deleted" })
  }

  return createLearnerProfile({
    ...input.profile,
    displayName: input.displayName,
  })
}

export function transitionLearnerProfileStatus(input: {
  readonly now: Date
  readonly profile: LearnerProfile
  readonly status: UserStatus
}): Result<LearnerProfile, IdentityError> {
  if (input.profile.status === input.status) {
    return err({
      from: input.profile.status,
      kind: "identity-invalid-status-transition",
      to: input.status,
    })
  }

  const profileResult = createLearnerProfile({
    deletedAt: input.status === userStatuses.deleted ? input.now : null,
    displayName:
      input.status === userStatuses.deleted
        ? deletedLearnerDisplayName
        : input.profile.displayName,
    status: input.status,
    userId: input.profile.userId,
  })
  if (profileResult.isErr()) return err(profileResult.error)

  return ok(profileResult.value)
}
