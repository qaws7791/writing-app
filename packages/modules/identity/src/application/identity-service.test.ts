import { describe, expect, it, vi } from "vitest"
import type { AdminId, UserId } from "@workspace/types/ids"
import { err, ok } from "@workspace/kernel/result"

import {
  createLearnerProfile,
  type LearnerProfile,
} from "#identity/domain/learner-profile"
import { createIdentityApplication } from "#identity/application/identity-service"
import {
  createAdminSessionResolver,
  createLearnerSessionResolver,
} from "#identity/application/identity-sessions"
import type {
  IdentityApplicationDependencies,
  IdentityRepository,
  LearnerAccount,
} from "#identity/application/identity-ports"

const now = new Date("2026-07-22T00:00:00.000Z")
const userId = "user-1" as UserId
const ownerId = "owner-1" as AdminId
const operatorId = "operator-1" as AdminId
const authenticatedLearner = {
  email: "learner@example.com",
  id: userId,
  image: null,
  joinedAt: new Date("2026-06-14T00:00:00.000Z"),
  name: "학습자",
} as const

describe("identity application", () => {
  it("인증 identity를 제품 사용자로 provisioning하고 profile query와 변경을 분리한다", async () => {
    const fixture = createApplicationFixture({ account: null })

    await expect(
      fixture.application.provisionLearner({
        ...authenticatedLearner,
        name: "   ",
      })
    ).resolves.toEqual(err({ kind: "identity-invalid-profile" }))
    expect(fixture.repository.provisionLearnerProfile).not.toHaveBeenCalled()

    await expect(
      fixture.application.provisionLearner(authenticatedLearner)
    ).resolves.toMatchObject({ value: { status: "active" } })
    await expect(
      fixture.application.readLearnerProfile(userId)
    ).resolves.toMatchObject({ value: { displayName: "학습자" } })
    await expect(
      fixture.application.changeLearnerDisplayName({
        displayName: "새 이름",
        userId,
      })
    ).resolves.toMatchObject({ value: { displayName: "새 이름" } })
  })

  it("owner 상태 변경에서 clock, repository와 session port fake를 사용한다", async () => {
    const fixture = createApplicationFixture()

    const result = await fixture.application.changeUserStatus({
      actor: { id: ownerId, role: "owner" },
      status: "suspended",
      userId,
    })

    expect(result._unsafeUnwrap()).toMatchObject({ status: "suspended" })
    expect(fixture.dependencies.clock.now).toHaveBeenCalledOnce()
    expect(
      fixture.dependencies.sessionRevocation.revokeLearnerSessions
    ).toHaveBeenCalledWith(userId)
    expect(
      fixture.dependencies.eventPublisher.publishUserStatusChanged
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { status: "suspended", userId },
        type: "identity.user-status-changed",
      })
    )
  })

  it("operator 요청은 persistence 전에 거절한다", async () => {
    const fixture = createApplicationFixture()

    await expect(
      fixture.application.deleteUser({
        actor: { id: operatorId, role: "operator" },
        userId,
      })
    ).resolves.toMatchObject({ error: { kind: "identity-forbidden" } })
    expect(fixture.repository.saveLearnerProfile).not.toHaveBeenCalled()
  })

  it("optimistic conflict를 Result로 반환한다", async () => {
    const fixture = createApplicationFixture({ saveConflict: true })

    await expect(
      fixture.application.changeUserStatus({
        actor: { id: ownerId, role: "owner" },
        status: "suspended",
        userId,
      })
    ).resolves.toMatchObject({ error: { kind: "identity-conflict" } })
    expect(
      fixture.dependencies.sessionRevocation.revokeLearnerSessions
    ).not.toHaveBeenCalled()
  })

  it("commit 이후 event 발행 실패를 관측하고 성공 결과는 유지한다", async () => {
    const fixture = createApplicationFixture({ eventFailure: true })

    const result = await fixture.application.changeUserStatus({
      actor: { id: ownerId, role: "owner" },
      status: "suspended",
      userId,
    })

    expect(result.isOk()).toBe(true)
    expect(fixture.dependencies.eventFailureObserver).toHaveBeenCalledWith({
      eventId: "identity-event-1",
      eventName: "identity.user-status-changed",
      kind: "identity-event-publish-failed",
    })
  })

  it("commit 이후 session 폐기 실패에도 상태 변경 event를 발행한다", async () => {
    const fixture = createApplicationFixture({ sessionFailure: true })

    const result = await fixture.application.changeUserStatus({
      actor: { id: ownerId, role: "owner" },
      status: "suspended",
      userId,
    })

    expect(result).toEqual(err({ kind: "identity-session-revocation-failed" }))
    expect(
      fixture.dependencies.eventPublisher.publishUserStatusChanged
    ).toHaveBeenCalledOnce()
  })

  it("관리자 role 변경은 owner 정책과 session 폐기를 함께 적용한다", async () => {
    const fixture = createApplicationFixture()

    const result = await fixture.application.changeAdminRole({
      actor: { id: ownerId, role: "owner" },
      adminId: operatorId,
      role: "owner",
    })

    expect(result._unsafeUnwrap()).toEqual({ id: operatorId, role: "owner" })
    expect(
      fixture.dependencies.sessionRevocation.revokeAdminSessions
    ).toHaveBeenCalledWith(operatorId)
  })

  it("auth port fake로 learner와 admin actor session을 해석한다", async () => {
    const fixture = createApplicationFixture()
    const learnerAuthentication = {
      resolveIdentity: vi.fn(async () => authenticatedLearner),
    }
    const adminAuthentication = {
      resolveIdentity: vi.fn(async () => ({
        email: "operator@example.com",
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
        id: operatorId,
        name: "운영자",
      })),
    }

    await expect(
      createLearnerSessionResolver({
        application: fixture.application,
        authentication: learnerAuthentication,
      }).resolveSession(new Headers())
    ).resolves.toMatchObject({ user: { id: userId, status: "active" } })
    await expect(
      createAdminSessionResolver({
        application: fixture.application,
        authentication: adminAuthentication,
      }).resolveSession(new Headers())
    ).resolves.toMatchObject({
      admin: { id: operatorId, role: "operator" },
    })
  })
})

function createApplicationFixture({
  account = createLearnerAccount(),
  eventFailure = false,
  saveConflict = false,
  sessionFailure = false,
}: {
  readonly account?: LearnerAccount | null
  readonly eventFailure?: boolean
  readonly saveConflict?: boolean
  readonly sessionFailure?: boolean
} = {}) {
  let currentAccount = account
  const repository = {
    findAdminIdentity: vi.fn(async (adminId) => ({
      identity: { id: adminId, role: "operator" as const },
      version: 0,
    })),
    findLearnerProfile: vi.fn(async () =>
      currentAccount === null ? null : toLearnerProfileRecord(currentAccount)
    ),
    listLearnerProfiles: vi.fn(async () =>
      currentAccount === null ? [] : [toLearnerProfileRecord(currentAccount)]
    ),
    provisionLearnerProfile: vi.fn(async ({ profile }) => {
      currentAccount = createLearnerAccount({ profile })
      return currentAccount.profile
    }),
    saveAdminIdentity: vi.fn(async (input) =>
      saveConflict
        ? err({ kind: "identity-conflict" as const })
        : ok({ identity: input.identity, version: input.expectedVersion + 1 })
    ),
    saveLearnerProfile: vi.fn(async (input) => {
      if (saveConflict) return err({ kind: "identity-conflict" as const })
      currentAccount = createLearnerAccount({ profile: input.profile })
      return ok(currentAccount.profile)
    }),
  } satisfies IdentityRepository
  const dependencies = {
    clock: { now: vi.fn(() => now) },
    eventFailureObserver: vi.fn(),
    eventIdGenerator: { next: vi.fn(() => "identity-event-1") },
    eventPublisher: {
      publishUserStatusChanged: vi.fn(async () =>
        eventFailure
          ? err({ kind: "identity-event-publish-failed" as const })
          : ok(undefined)
      ),
    },
    learnerIdentityDirectory: {
      findLearnerIdentity: vi.fn(async () => authenticatedLearner),
      listLearnerIdentities: vi.fn(async () => [authenticatedLearner]),
    },
    repository,
    sessionRevocation: {
      revokeAdminSessions: vi.fn(async () => ok(undefined)),
      revokeLearnerSessions: vi.fn(async () =>
        sessionFailure
          ? err({ kind: "session-revocation-failed" as const })
          : ok(undefined)
      ),
    },
  } satisfies IdentityApplicationDependencies

  return {
    application: createIdentityApplication(dependencies),
    dependencies,
    repository,
  }
}

function createLearnerAccount({
  profile = createLearnerProfile({
    displayName: "학습자",
    userId,
  })._unsafeUnwrap(),
}: {
  readonly profile?: LearnerProfile
} = {}): LearnerAccount {
  return {
    createdAt: authenticatedLearner.joinedAt,
    email: authenticatedLearner.email,
    id: userId,
    image: null,
    profile: { profile, version: 0 },
  }
}

function toLearnerProfileRecord(account: LearnerAccount) {
  return {
    ...account.profile.profile,
    version: account.profile.version ?? 0,
  }
}
