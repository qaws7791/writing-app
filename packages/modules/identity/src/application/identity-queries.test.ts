import { describe, expect, it, vi } from "vitest"
import type { UserId } from "@workspace/types/ids"
import { err } from "@workspace/kernel/result"

import { createLearnerProfile } from "#identity/domain/learner-profile"
import {
  createIdentityLearningQuery,
  createOperationsIdentityReportingQuery,
} from "#identity/application/identity-queries"
import type {
  AuthenticatedLearnerIdentity,
  IdentityRepository,
  LearnerAccount,
  LearnerIdentityDirectoryPort,
  LearnerProfileRecord,
} from "#identity/application/identity-ports"

const userId = "user-1" as UserId
const deletedUserId = "user-2" as UserId
const account: LearnerAccount = {
  createdAt: new Date("2026-06-14T00:00:00.000Z"),
  email: "learner@example.com",
  id: userId,
  image: null,
  profile: {
    profile: createLearnerProfile({
      displayName: "학습자",
      status: "suspended",
      userId,
    })._unsafeUnwrap(),
    version: 1,
  },
}
const identity: AuthenticatedLearnerIdentity = {
  email: account.email,
  id: account.id,
  image: account.image,
  joinedAt: account.createdAt,
  name: account.profile.profile.displayName,
}
const profileRecord: LearnerProfileRecord = {
  ...account.profile.profile,
  version: account.profile.version ?? 0,
}
const deletedIdentity: AuthenticatedLearnerIdentity = {
  ...identity,
  email: "deleted@example.com",
  id: deletedUserId,
  name: "삭제 전 이름",
}
const deletedProfileRecord: LearnerProfileRecord = {
  deletedAt: new Date("2026-07-22T00:00:00.000Z"),
  displayName: "삭제된 사용자",
  status: "deleted",
  userId: deletedUserId,
  version: 2,
}

describe("identity public query ports", () => {
  it("learning에는 제품 사용자 상태만 Result로 공개한다", async () => {
    const repository = createRepository()
    const query = createIdentityLearningQuery({
      learnerIdentityDirectory: createIdentityDirectory(),
      repository,
    })

    await expect(query.readLearnerStatus(userId)).resolves.toMatchObject({
      value: "suspended",
    })
    await expect(
      createIdentityLearningQuery({
        learnerIdentityDirectory: createIdentityDirectory(),
        repository: createRepository({
          findLearnerProfile: async () => null,
        }),
      }).readLearnerStatus(userId)
    ).resolves.toMatchObject({ value: "active" })
    await expect(
      createIdentityLearningQuery({
        learnerIdentityDirectory: createIdentityDirectory({
          findLearnerIdentity: async () => null,
        }),
        repository,
      }).readLearnerStatus(userId)
    ).resolves.toEqual(err({ kind: "identity-not-found" }))
  })

  it("operations에는 auth table 대신 비삭제 identity snapshot을 공개한다", async () => {
    const repository = createRepository({
      listLearnerProfiles: vi.fn(async () => [
        profileRecord,
        deletedProfileRecord,
      ]),
    })
    const identityDirectory = createIdentityDirectory({
      listLearnerIdentities: vi.fn(async () => [identity, deletedIdentity]),
    })
    const query = createOperationsIdentityReportingQuery({
      learnerIdentityDirectory: identityDirectory,
      repository,
    })

    await expect(query.readNonDeletedLearners()).resolves.toEqual([
      {
        createdAt: new Date("2026-06-14T00:00:00.000Z"),
        email: "learner@example.com",
        id: userId,
        name: "학습자",
      },
    ])
    expect(repository.listLearnerProfiles).toHaveBeenCalledOnce()
    expect(identityDirectory.listLearnerIdentities).toHaveBeenCalledOnce()
  })
})

function createRepository(
  overrides: Partial<IdentityRepository> = {}
): IdentityRepository {
  return {
    findAdminIdentity: async () => null,
    findLearnerProfile: async () => profileRecord,
    listLearnerProfiles: vi.fn(async () => [profileRecord]),
    provisionLearnerProfile: async () => account.profile,
    saveAdminIdentity: async () => err({ kind: "identity-conflict" }),
    saveLearnerProfile: async () => err({ kind: "identity-conflict" }),
    ...overrides,
  }
}

function createIdentityDirectory(
  overrides: Partial<LearnerIdentityDirectoryPort> = {}
): LearnerIdentityDirectoryPort {
  return {
    findLearnerIdentity: async () => identity,
    listLearnerIdentities: vi.fn(async () => [identity]),
    ...overrides,
  }
}
