import type { UserId } from "@workspace/types/ids"

import {
  createLearnerProfile,
  deletedLearnerDisplayName,
} from "#identity/domain/learner-profile"
import { userStatuses, type UserStatus } from "#identity/domain/user-status"
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

export async function listLearnerAccounts(
  dependencies: LearnerAccountReaderDependencies,
  input: Readonly<{
    query: string
    status: UserStatus | "all"
  }>
): Promise<readonly LearnerAccount[]> {
  const [identities, profiles] = await Promise.all([
    dependencies.learnerIdentityDirectory.listLearnerIdentities(),
    dependencies.repository.listLearnerProfiles(),
  ])
  const profilesByUserId = new Map(
    profiles.map((profile) => [profile.userId, profile])
  )
  const query = input.query.trim().toLowerCase()

  return identities
    .map((identity) =>
      toLearnerAccount(identity, profilesByUserId.get(identity.id) ?? null)
    )
    .filter(
      (account) =>
        matchesStatus(account, input.status) && matchesQuery(account, query)
    )
    .sort((left, right) => left.id.localeCompare(right.id))
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

  return Object.freeze({
    createdAt: new Date(identity.joinedAt),
    email: identity.email,
    id: identity.id,
    image: identity.image,
    profile: Object.freeze({
      profile: profile.value,
      version: record?.version ?? null,
    }),
  })
}

function matchesStatus(
  account: LearnerAccount,
  status: UserStatus | "all"
): boolean {
  return status === "all"
    ? account.profile.profile.status !== userStatuses.deleted
    : account.profile.profile.status === status
}

function matchesQuery(account: LearnerAccount, query: string): boolean {
  return (
    query.length === 0 ||
    account.email.toLowerCase().includes(query) ||
    account.profile.profile.displayName.toLowerCase().includes(query)
  )
}
