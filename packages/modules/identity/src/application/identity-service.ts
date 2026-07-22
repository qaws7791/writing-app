import { err, ok, type Result } from "@workspace/kernel/result"

import {
  decideAdminRoleChange,
  type AdminIdentity,
} from "#identity/domain/admin-role"
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
  ChangeAdminRoleCommand,
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
  changeAdminRole: (
    command: ChangeAdminRoleCommand
  ) => Promise<Result<AdminIdentity, IdentityError>>
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
    async changeAdminRole(command) {
      const snapshot = await dependencies.repository.findAdminIdentity(
        command.adminId
      )
      if (snapshot === null) return err({ kind: "identity-not-found" })

      const decision = decideAdminRoleChange({
        actor: command.actor,
        identity: snapshot.identity,
        role: command.role,
      })
      if (decision.isErr()) return err(decision.error)

      const saved = await dependencies.repository.saveAdminIdentity({
        expectedVersion: snapshot.version,
        identity: decision.value,
      })
      if (saved.isErr()) return err(saved.error)

      const revoked = await dependencies.sessionRevocation.revokeAdminSessions(
        command.adminId
      )
      return revoked.isErr()
        ? err({ kind: "identity-session-revocation-failed" })
        : ok(saved.value.identity)
    },
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
      return changeStatus(dependencies, {
        ...command,
        status: userStatuses.deleted,
      })
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
      const snapshot = await dependencies.repository.findAdminIdentity(
        identity.id
      )
      if (snapshot === null) return err({ kind: "identity-not-found" })

      return ok(
        Object.freeze({
          admin: Object.freeze({
            email: identity.email,
            id: identity.id,
            name: identity.name,
            role: snapshot.identity.role,
          }),
          [adminSessionExpiresAt]: new Date(identity.expiresAt),
        })
      )
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

      return ok(
        Object.freeze({
          user: Object.freeze({
            email: identity.email,
            id: identity.id,
            image: identity.image,
            joinedAt: identity.joinedAt.toISOString(),
            name: account.profile.profile.displayName,
            status: account.profile.profile.status,
          }),
        })
      )
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
  command: ChangeUserStatusCommand
): Promise<Result<LearnerProfile, IdentityError>> {
  if (command.actor.role !== "owner") {
    return err({ kind: "identity-forbidden" })
  }

  const account = await findLearnerAccount(dependencies, command.userId)
  if (account === null) return err({ kind: "identity-not-found" })

  const decision = transitionLearnerProfileStatus({
    eventId: dependencies.eventIdGenerator.next(),
    now: dependencies.clock.now(),
    profile: account.profile.profile,
    status: command.status,
  })
  if (decision.isErr()) return err(decision.error)

  const saved = await dependencies.repository.saveLearnerProfile({
    expectedVersion: account.profile.version,
    profile: decision.value.aggregate,
  })
  if (saved.isErr()) return err(saved.error)

  for (const event of decision.value.events) {
    const published =
      await dependencies.eventPublisher.publishUserStatusChanged(event)
    if (published.isErr()) {
      dependencies.eventFailureObserver({
        eventId: event.id,
        eventName: event.type,
        kind: published.error.kind,
      })
    }
  }

  const revoked = await dependencies.sessionRevocation.revokeLearnerSessions(
    command.userId
  )
  if (revoked.isErr()) {
    return err({ kind: "identity-session-revocation-failed" })
  }

  return ok(saved.value.profile)
}
