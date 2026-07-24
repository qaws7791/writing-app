import { err, ok, type Result } from "@workspace/kernel/result"

import type { IdentityError } from "#identity/domain/identity-error"
import {
  changeLearnerDisplayName,
  createLearnerProfile,
  transitionLearnerProfileStatus,
  type LearnerProfile,
} from "#identity/domain/learner-profile"
import { userStatuses } from "#identity/domain/user-status"
import type {
  AuthenticatedAdminIdentity,
  AuthenticatedLearnerIdentity,
  ChangeUserStatusCommand,
  IdentityApplicationDependencies,
} from "#identity/application/identity-ports"
import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AuthenticatedSession,
} from "#identity/application/identity-session"
import { findLearnerAccount } from "#identity/application/learner-account-reader"

export type IdentityApplication = Readonly<{
  changeLearnerDisplayName: (command: {
    readonly displayName: string
    readonly userId: AuthenticatedLearnerIdentity["id"]
  }) => Promise<Result<LearnerProfile, IdentityError>>
  changeUserStatus: (
    command: ChangeUserStatusCommand
  ) => Promise<Result<LearnerProfile, IdentityError>>
  deleteUser: (
    command: Omit<ChangeUserStatusCommand, "status">
  ) => Promise<Result<LearnerProfile, IdentityError>>
  provisionLearner: (
    identity: AuthenticatedLearnerIdentity
  ) => Promise<Result<LearnerProfile, IdentityError>>
  readLearnerProfile: (
    userId: AuthenticatedLearnerIdentity["id"]
  ) => Promise<Result<LearnerProfile, IdentityError>>
  resolveAdminIdentity: (
    identity: AuthenticatedAdminIdentity
  ) => Promise<Result<AdminAuthenticatedSession, IdentityError>>
  resolveLearnerIdentity: (
    identity: AuthenticatedLearnerIdentity
  ) => Promise<Result<AuthenticatedSession, IdentityError>>
}>

export function createIdentityApplication(
  dependencies: IdentityApplicationDependencies
): IdentityApplication {
  return {
    async changeLearnerDisplayName(command) {
      const account = await findLearnerAccount(dependencies, command.userId)
      if (account === null) return err({ kind: "identity-not-found" })

      const changed = changeLearnerDisplayName({
        displayName: command.displayName,
        profile: account.profile.profile,
      })
      if (changed.isErr()) return err(changed.error)

      const saved = await dependencies.repository.saveLearnerProfile({
        expectedVersion: account.profile.version,
        profile: changed.value,
      })
      return saved.map(({ profile }) => profile)
    },
    async changeUserStatus(command) {
      return changeStatus(dependencies, command)
    },
    async deleteUser(command) {
      return changeStatus(
        dependencies,
        {
          ...command,
          status: userStatuses.deleted,
        },
        async (requestedAt) => {
          const recorded = await dependencies.deletionMarkerStore.record({
            requestedAt,
            userId: command.userId,
          })
          return recorded.isErr()
            ? err({ kind: "identity-deletion-marker-failed" as const })
            : ok(undefined)
        }
      )
    },
    async provisionLearner(identity) {
      return provisionLearnerProfile(dependencies, identity)
    },
    async readLearnerProfile(userId) {
      const account = await findLearnerAccount(dependencies, userId)
      return account === null
        ? err({ kind: "identity-not-found" })
        : ok(account.profile.profile)
    },
    async resolveAdminIdentity(identity) {
      return ok({
        admin: {
          email: identity.email,
          id: identity.id,
          name: identity.name,
        },
        [adminSessionExpiresAt]: new Date(identity.expiresAt),
      })
    },
    async resolveLearnerIdentity(identity) {
      let account = await findLearnerAccount(dependencies, identity.id)
      if (account === null) {
        const provisioned = await provisionLearnerProfile(
          dependencies,
          identity
        )
        if (provisioned.isErr()) return err(provisioned.error)
        account = await findLearnerAccount(dependencies, identity.id)
      }
      if (account === null) return err({ kind: "identity-not-found" })

      return ok({
        user: {
          email: identity.email,
          id: identity.id,
          image: identity.image,
          joinedAt: identity.joinedAt.toISOString(),
          name: account.profile.profile.displayName,
          status: account.profile.profile.status,
        },
      })
    },
  }
}

async function provisionLearnerProfile(
  dependencies: IdentityApplicationDependencies,
  identity: AuthenticatedLearnerIdentity
): Promise<Result<LearnerProfile, IdentityError>> {
  const profile = createLearnerProfile({
    displayName: identity.name,
    userId: identity.id,
  })
  if (profile.isErr()) return err(profile.error)

  const snapshot = await dependencies.repository.provisionLearnerProfile({
    profile: profile.value,
  })
  return ok(snapshot.profile)
}

async function changeStatus(
  dependencies: IdentityApplicationDependencies,
  command: ChangeUserStatusCommand,
  beforeSave: (
    requestedAt: Date
  ) => Promise<Result<void, IdentityError>> = async () => ok(undefined)
): Promise<Result<LearnerProfile, IdentityError>> {
  const account = await findLearnerAccount(dependencies, command.userId)
  if (account === null) return err({ kind: "identity-not-found" })

  const requestedAt = dependencies.clock.now()
  const decision = transitionLearnerProfileStatus({
    now: requestedAt,
    profile: account.profile.profile,
    status: command.status,
  })
  if (decision.isErr()) return err(decision.error)

  const prepared = await beforeSave(requestedAt)
  if (prepared.isErr()) return err(prepared.error)

  const saved = await dependencies.repository.saveLearnerProfile({
    expectedVersion: account.profile.version,
    profile: decision.value,
  })
  if (saved.isErr()) return err(saved.error)

  const revoked = await dependencies.sessionRevocation.revokeLearnerSessions(
    command.userId
  )
  if (revoked.isErr()) {
    return err({ kind: "identity-session-revocation-failed" })
  }

  return ok(saved.value.profile)
}
