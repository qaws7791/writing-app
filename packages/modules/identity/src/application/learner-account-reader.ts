import type { UserId } from "@workspace/types/ids"

import {
  createLearnerProfile,
  deletedLearnerDisplayName,
} from "#identity/domain/learner-profile"
import { userStatuses } from "#identity/domain/user-status"
import type {
  AuthenticatedLearnerIdentity,
  IdentityRepository,
  LearnerAccount,
  LearnerIdentityDirectoryPort,
  LearnerProfileRecord,
} from "#identity/application/identity-ports"

type LearnerAccountReaderDependencies = Readonly<{
  learnerIdentityDirectory: LearnerIdentityDirectoryPort
  repository: IdentityRepository
}>

export async function findLearnerAccount(
  dependencies: LearnerAccountReaderDependencies,
  userId: UserId
): Promise<LearnerAccount | null> {
  const [identity, profile] = await Promise.all([
    dependencies.learnerIdentityDirectory.findLearnerIdentity(userId),
    dependencies.repository.findLearnerProfile(userId),
  ])

  return identity === null ? null : toLearnerAccount(identity, profile)
}

function toLearnerAccount(
  identity: AuthenticatedLearnerIdentity,
  record: LearnerProfileRecord | null
): LearnerAccount {
  const profile = createLearnerProfile({
    deletedAt: record?.deletedAt ?? null,
    displayName:
      record?.status === userStatuses.deleted
        ? deletedLearnerDisplayName
        : (record?.displayName ?? identity.name),
    status: record?.status ?? userStatuses.active,
    userId: identity.id,
  })
  if (profile.isErr()) {
    throw new Error("저장된 학습자 identity profile이 올바르지 않습니다.")
  }

  return {
    createdAt: new Date(identity.joinedAt),
    email: identity.email,
    id: identity.id,
    image: identity.image,
    profile: {
      profile: profile.value,
      version: record?.version ?? null,
    },
  }
}
