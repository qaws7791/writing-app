import { describe, expect, it } from "vitest"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import type { WritingAppDatabaseClient } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"

import {
  createLearnerProfile,
  deletedLearnerDisplayName,
} from "#identity/domain/learner-profile"
import { createDeletedLearnerPurgeRepository } from "#identity/infrastructure/persistence/deleted-learner-purge-repository"
import { createDrizzleIdentityRepository } from "#identity/infrastructure/persistence/identity-drizzle-repository"
import { identityLearnerDataPurge } from "#identity/infrastructure/persistence/learner-purge"
import { learnerProfiles } from "#identity/infrastructure/persistence/schema"
import { aLearner } from "#identity/test/fixtures/a-learner"

const now = new Date("2026-07-22T00:00:00.000Z")
const userId = userIdSchema.parse("user-1")

describe("identity SQLite repository", () => {
  it("이미 profile이 있으면 재-provisioning으로 표시 이름을 덮어쓰지 않는다", async () => {
    await withIdentityDatabase(async (client) => {
      const repository = createDrizzleIdentityRepository(client.db)

      await repository.provisionLearnerProfile({
        profile: aProfile({ displayName: "첫 이름" }),
      })
      await repository.provisionLearnerProfile({
        profile: aProfile({ displayName: "덮어쓰면 안 되는 이름" }),
      })

      expect(await repository.findLearnerProfile(userId)).toMatchObject({
        displayName: "첫 이름",
        status: "active",
        version: 0,
      })
    })
  })

  it("기대 version과 일치하는 저장만 통과시키고 재사용된 version은 conflict로 거절한다", async () => {
    await withIdentityDatabase(async (client) => {
      const repository = createDrizzleIdentityRepository(client.db)
      const provisioned = await repository.provisionLearnerProfile({
        profile: aProfile({ displayName: "첫 이름" }),
      })
      const suspended = aProfile({
        displayName: "첫 이름",
        status: "suspended",
      })

      expect(
        (
          await repository.saveLearnerProfile({
            expectedVersion: provisioned.version,
            profile: suspended,
          })
        )._unsafeUnwrap()
      ).toMatchObject({ profile: { status: "suspended" }, version: 1 })
      expect(
        (
          await repository.saveLearnerProfile({
            expectedVersion: provisioned.version,
            profile: suspended,
          })
        )._unsafeUnwrapErr()
      ).toEqual({ kind: "identity-conflict" })
    })
  })

  it("삭제 전이는 비식별 표시 이름과 다음 version으로 저장한다", async () => {
    await withIdentityDatabase(async (client) => {
      const repository = createDrizzleIdentityRepository(client.db)
      await repository.provisionLearnerProfile({
        profile: aProfile({ displayName: "첫 이름" }),
      })
      await repository.saveLearnerProfile({
        expectedVersion: 0,
        profile: aProfile({ displayName: "첫 이름", status: "suspended" }),
      })

      expect(
        (
          await repository.saveLearnerProfile({
            expectedVersion: 1,
            profile: aProfile({
              deletedAt: now,
              displayName: deletedLearnerDisplayName,
              status: "deleted",
            }),
          })
        )._unsafeUnwrap()
      ).toMatchObject({
        profile: { displayName: deletedLearnerDisplayName, status: "deleted" },
        version: 2,
      })
    })
  })

  it("purge 도중 module purge가 실패하면 삭제 profile을 rollback으로 보존한다", async () => {
    await withIdentityDatabase(async (client) => {
      aLearner(client.sqlite, {
        deletedAt: now.getTime(),
        id: "user-2",
        status: "deleted",
      })
      const repository = createDeletedLearnerPurgeRepository({
        database: client.db,
        learnerDataPurges: [
          identityLearnerDataPurge,
          {
            moduleName: "failing-module",
            purge() {
              throw new Error("purge fixture failed")
            },
          },
        ],
      })

      const result = await repository.purgeDeletedBefore({
        batchSize: 10,
        cutoff: new Date(now.getTime() + 1),
        dryRun: false,
      })

      expect(result._unsafeUnwrapErr()).toMatchObject({
        kind: "deleted-learner-purge-failed",
      })
      expect(
        client.db
          .select({ userId: learnerProfiles.userId })
          .from(learnerProfiles)
          .all()
      ).toEqual([{ userId: "user-2" }])
    })
  })
})

async function withIdentityDatabase(
  run: (client: WritingAppDatabaseClient) => Promise<void>
): Promise<void> {
  const client = createInMemoryWritingAppDatabase()
  try {
    runCurrentTestMigration(client.sqlite)
    aLearner(client.sqlite, {
      id: userId,
      includeProfile: false,
      name: "학습자",
    })
    await run(client)
  } finally {
    client.close()
  }
}

function aProfile(
  input: Readonly<{
    deletedAt?: Date
    displayName: string
    status?: "active" | "deleted" | "suspended"
  }>
) {
  return createLearnerProfile({
    deletedAt: input.deletedAt ?? null,
    displayName: input.displayName,
    status: input.status ?? "active",
    userId,
  })._unsafeUnwrap()
}
