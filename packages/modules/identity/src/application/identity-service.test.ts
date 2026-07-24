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
const adminId = "admin-1" as AdminId
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

  it("관리자 상태 변경에서 clock, repository와 session port fake를 사용한다", async () => {
    const fixture = createApplicationFixture()

    const result = await fixture.application.changeUserStatus({
      actor: { id: adminId },
      status: "suspended",
      userId,
    })

    expect(result._unsafeUnwrap()).toMatchObject({ status: "suspended" })
    expect(fixture.dependencies.clock.now).toHaveBeenCalledOnce()
    expect(
      fixture.dependencies.sessionRevocation.revokeLearnerSessions
    ).toHaveBeenCalledWith(userId)
  })

  it("optimistic conflict를 Result로 반환한다", async () => {
    const fixture = createApplicationFixture({ saveConflict: true })

    await expect(
      fixture.application.changeUserStatus({
        actor: { id: adminId },
        status: "suspended",
        userId,
      })
    ).resolves.toMatchObject({ error: { kind: "identity-conflict" } })
    expect(
      fixture.dependencies.sessionRevocation.revokeLearnerSessions
    ).not.toHaveBeenCalled()
  })

  it("commit 이후 session 폐기 실패를 명시적인 실패로 반환한다", async () => {
    const fixture = createApplicationFixture({ sessionFailure: true })

    const result = await fixture.application.changeUserStatus({
      actor: { id: adminId },
      status: "suspended",
      userId,
    })

    expect(result).toEqual(err({ kind: "identity-session-revocation-failed" }))
  })

  it("삭제 marker 기록 실패 시 profile과 session을 변경하지 않는다", async () => {
    const fixture = createApplicationFixture({ markerFailure: true })

    await expect(
      fixture.application.deleteUser({
        actor: { id: adminId },
        userId,
      })
    ).resolves.toEqual(err({ kind: "identity-deletion-marker-failed" }))
    expect(
      fixture.dependencies.deletionMarkerStore.record
    ).toHaveBeenCalledWith({
      requestedAt: now,
      userId,
    })
    expect(fixture.repository.saveLearnerProfile).not.toHaveBeenCalled()
    expect(
      fixture.dependencies.sessionRevocation.revokeLearnerSessions
    ).not.toHaveBeenCalled()
  })

  it("auth port fake로 learner와 admin actor session을 해석한다", async () => {
    const fixture = createApplicationFixture()
    const learnerAuthentication = {
      resolveIdentity: vi.fn(async () => authenticatedLearner),
    }
    const adminAuthentication = {
      resolveIdentity: vi.fn(async () => ({
        email: "admin@example.com",
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
        id: adminId,
        name: "관리자",
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
      admin: { id: adminId },
    })
  })
})

function createApplicationFixture({
  account = createLearnerAccount(),
  markerFailure = false,
  saveConflict = false,
  sessionFailure = false,
}: {
  readonly account?: LearnerAccount | null
  readonly markerFailure?: boolean
  readonly saveConflict?: boolean
  readonly sessionFailure?: boolean
} = {}) {
  let currentAccount = account
  const repository = {
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
    saveLearnerProfile: vi.fn(async (input) => {
      if (saveConflict) return err({ kind: "identity-conflict" as const })
      currentAccount = createLearnerAccount({ profile: input.profile })
      return ok(currentAccount.profile)
    }),
  } satisfies IdentityRepository
  const dependencies = {
    clock: { now: vi.fn(() => now) },
    deletionMarkerStore: {
      record: vi.fn(async () =>
        markerFailure
          ? err({ kind: "deletion-marker-storage-failed" as const })
          : ok(undefined)
      ),
    },
    learnerIdentityDirectory: {
      findLearnerIdentity: vi.fn(async () => authenticatedLearner),
      listLearnerIdentities: vi.fn(async () => [authenticatedLearner]),
    },
    repository,
    sessionRevocation: {
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
