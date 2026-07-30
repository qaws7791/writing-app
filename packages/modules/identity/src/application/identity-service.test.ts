import { describe, expect, it, vi } from "vitest"
import type { AdminId, UserId } from "@workspace/types/ids"
import { err, ok } from "@workspace/kernel/result"

import {
  createLearnerProfile,
  deletedLearnerDisplayName,
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
  it("공백만 남는 표시 이름은 provisioning 전에 거절한다", async () => {
    const fixture = createApplicationFixture({ account: null })

    await expect(
      fixture.application.provisionLearner({
        ...authenticatedLearner,
        name: "   ",
      })
    ).resolves.toEqual(err({ kind: "identity-invalid-profile" }))
    expect(fixture.repository.provisionLearnerProfile).not.toHaveBeenCalled()
  })

  it("인증 identity를 active 제품 사용자로 provisioning한다", async () => {
    const fixture = createApplicationFixture({ account: null })

    await expect(
      fixture.application.provisionLearner(authenticatedLearner)
    ).resolves.toMatchObject({ value: { status: "active" } })
  })

  it("provisioning된 학습자 profile을 표시 이름과 함께 조회한다", async () => {
    const fixture = createApplicationFixture({ account: null })
    await fixture.application.provisionLearner(authenticatedLearner)

    await expect(
      fixture.application.readLearnerProfile(userId)
    ).resolves.toMatchObject({ value: { displayName: "학습자" } })
  })

  it("학습자가 요청한 새 표시 이름을 profile에 반영한다", async () => {
    const fixture = createApplicationFixture()

    await expect(
      fixture.application.changeLearnerDisplayName({
        displayName: "새 이름",
        userId,
      })
    ).resolves.toMatchObject({ value: { displayName: "새 이름" } })
  })

  it("정지 전이는 학습자 session을 폐기한다", async () => {
    const fixture = createApplicationFixture()

    const result = await fixture.application.changeUserStatus({
      actor: { id: adminId },
      status: "suspended",
      userId,
    })

    expect(result._unsafeUnwrap()).toMatchObject({ status: "suspended" })
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

  it("삭제 성공 경로는 표시 이름을 비식별화하고 session을 폐기한다", async () => {
    const fixture = createApplicationFixture()

    const result = await fixture.application.deleteUser({
      actor: { id: adminId },
      userId,
    })

    expect(result._unsafeUnwrap()).toEqual({
      deletedAt: now,
      displayName: deletedLearnerDisplayName,
      status: "deleted",
      userId,
    })
    expect(
      fixture.dependencies.sessionRevocation.revokeLearnerSessions
    ).toHaveBeenCalledWith(userId)
  })

  it("삭제 marker는 profile 저장 전에 요청 시각과 함께 기록한다", async () => {
    const fixture = createApplicationFixture()

    await fixture.application.deleteUser({ actor: { id: adminId }, userId })

    expect(
      fixture.dependencies.deletionMarkerStore.record
    ).toHaveBeenCalledWith({ requestedAt: now, userId })
    expect(fixture.calls).toEqual([
      "deletion-marker:record",
      "repository:save",
      "session:revoke",
    ])
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

  it("학습자 session은 제품 identity 상태를 함께 해석한다", async () => {
    const fixture = createApplicationFixture()

    await expect(
      createLearnerSessionResolver({
        application: fixture.application,
        authentication: {
          resolveIdentity: async () => authenticatedLearner,
        },
      }).resolveSession(new Headers())
    ).resolves.toMatchObject({ user: { id: userId, status: "active" } })
  })

  it("관리자 session은 admin 식별자만 해석한다", async () => {
    const fixture = createApplicationFixture()

    await expect(
      createAdminSessionResolver({
        application: fixture.application,
        authentication: {
          resolveIdentity: async () => ({
            email: "admin@example.com",
            expiresAt: new Date("2099-01-01T00:00:00.000Z"),
            id: adminId,
            name: "관리자",
          }),
        },
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
  const calls: string[] = []
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
      calls.push("repository:save")
      if (saveConflict) return err({ kind: "identity-conflict" as const })
      currentAccount = createLearnerAccount({ profile: input.profile })
      return ok(currentAccount.profile)
    }),
  } satisfies IdentityRepository
  const dependencies = {
    clock: { now: vi.fn(() => now) },
    deletionMarkerStore: {
      record: vi.fn(async () => {
        calls.push("deletion-marker:record")
        return markerFailure
          ? err({ kind: "deletion-marker-storage-failed" as const })
          : ok(undefined)
      }),
    },
    learnerIdentityDirectory: {
      findLearnerIdentity: vi.fn(async () => authenticatedLearner),
      listLearnerIdentities: vi.fn(async () => [authenticatedLearner]),
    },
    repository,
    sessionRevocation: {
      revokeLearnerSessions: vi.fn(async () => {
        calls.push("session:revoke")
        return sessionFailure
          ? err({ kind: "session-revocation-failed" as const })
          : ok(undefined)
      }),
    },
  } satisfies IdentityApplicationDependencies

  return {
    application: createIdentityApplication(dependencies),
    calls,
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
