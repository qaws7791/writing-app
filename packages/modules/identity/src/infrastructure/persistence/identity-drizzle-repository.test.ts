import { describe, expect, it } from "vitest"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import { runInSqliteTransaction } from "@workspace/db/sqlite-database"

import {
  createLearnerProfile,
  deletedLearnerDisplayName,
} from "#identity/domain/learner-profile"
import { createDrizzleIdentityRepository } from "#identity/infrastructure/persistence/identity-drizzle-repository"
import { learnerProfiles } from "#identity/infrastructure/persistence/schema"

const now = new Date("2026-07-22T00:00:00.000Z")

describe("identity SQLite repository", () => {
  it("profile provisioning과 optimistic status 변경을 통합 검증한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    const userId = userIdSchema.parse("user-1")

    try {
      runCurrentTestMigration(client.sqlite)
      client.sqlite.exec(`
        INSERT INTO user (
          id, name, email, email_verified, image, created_at, updated_at
        ) VALUES ('user-1', '학습자', 'user-1@example.test', 1, NULL, 1, 1);
      `)
      const repository = createDrizzleIdentityRepository(client.db)

      const provisioned = await repository.provisionLearnerProfile({
        profile: createLearnerProfile({
          displayName: "첫 이름",
          userId,
        })._unsafeUnwrap(),
      })
      await repository.provisionLearnerProfile({
        profile: createLearnerProfile({
          displayName: "덮어쓰면 안 되는 이름",
          userId,
        })._unsafeUnwrap(),
      })
      expect(await repository.findLearnerProfile(userId)).toMatchObject({
        displayName: "첫 이름",
        status: "active",
        version: 0,
      })

      const suspended = createLearnerProfile({
        displayName: provisioned.profile.displayName,
        status: "suspended",
        userId,
      })._unsafeUnwrap()
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
      const deleted = createLearnerProfile({
        deletedAt: now,
        displayName: deletedLearnerDisplayName,
        status: "deleted",
        userId,
      })._unsafeUnwrap()
      expect(
        (
          await repository.saveLearnerProfile({
            expectedVersion: 1,
            profile: deleted,
          })
        )._unsafeUnwrap()
      ).toMatchObject({ profile: { status: "deleted" }, version: 2 })
      expect(
        (
          await repository.saveLearnerProfile({
            expectedVersion: 1,
            profile: deleted,
          })
        )._unsafeUnwrapErr()
      ).toEqual({ kind: "identity-conflict" })
    } finally {
      client.close()
    }
  })

  it("transaction rollback을 보존한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runCurrentTestMigration(client.sqlite)
      client.sqlite.exec(`
        INSERT INTO user (
          id, name, email, email_verified, image, created_at, updated_at
        ) VALUES ('user-2', '학습자', 'user-2@example.test', 1, NULL, 1, 1)
      `)

      expect(() =>
        runInSqliteTransaction(client.db, (transaction) => {
          transaction
            .insert(learnerProfiles)
            .values({
              displayName: "두 번째 학습자",
              status: "active",
              userId: "user-2",
              version: 0,
            })
            .run()
          throw new Error("rollback fixture")
        })
      ).toThrow("rollback fixture")
      expect(client.db.select().from(learnerProfiles).all()).toEqual([])
    } finally {
      client.close()
    }
  })
})
