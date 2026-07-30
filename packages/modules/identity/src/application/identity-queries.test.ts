import { describe, expect, it, vi } from "vitest"
import type { UserId } from "@workspace/types/ids"
import { err } from "@workspace/kernel/result"

import { createLearnerProfile } from "#identity/domain/learner-profile"
import { createIdentityLearningQuery } from "#identity/application/identity-queries"
import type {
  AuthenticatedLearnerIdentity,
  IdentityRepository,
  LearnerAccount,
  LearnerIdentityDirectoryPort,
  LearnerProfileRecord,
} from "#identity/application/identity-ports"

const userId = "user-1" as UserId
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
describe("identity public query ports", () => {
  it("정지된 학습자의 제품 상태를 learning에 그대로 공개한다", async () => {
    const query = createIdentityLearningQuery({
      learnerIdentityDirectory: createIdentityDirectory(),
      repository: createRepository(),
    })

    await expect(query.readLearnerStatus(userId)).resolves.toMatchObject({
      value: "suspended",
    })
  })

  it("profile이 아직 없는 인증 학습자는 active로 공개한다", async () => {
    const query = createIdentityLearningQuery({
      learnerIdentityDirectory: createIdentityDirectory(),
      repository: createRepository({ findLearnerProfile: async () => null }),
    })

    await expect(query.readLearnerStatus(userId)).resolves.toMatchObject({
      value: "active",
    })
  })

  it("인증 identity가 없으면 not-found를 Result로 반환한다", async () => {
    const query = createIdentityLearningQuery({
      learnerIdentityDirectory: createIdentityDirectory({
        findLearnerIdentity: async () => null,
      }),
      repository: createRepository(),
    })

    await expect(query.readLearnerStatus(userId)).resolves.toEqual(
      err({ kind: "identity-not-found" })
    )
  })
})

function createRepository(
  overrides: Partial<IdentityRepository> = {}
): IdentityRepository {
  return {
    findLearnerProfile: async () => profileRecord,
    listLearnerProfiles: vi.fn(async () => [profileRecord]),
    provisionLearnerProfile: async () => account.profile,
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
