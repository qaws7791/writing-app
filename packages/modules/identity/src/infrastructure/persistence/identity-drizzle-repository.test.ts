import { describe, expect, it } from "vitest"
import {
  adminIdSchema,
  userIdSchema,
} from "@workspace/contracts/identity/admin-ids"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { runInSqliteTransaction } from "@workspace/db/sqlite-database"

import {
  createLearnerProfile,
  deletedLearnerDisplayName,
} from "#identity/domain/learner-profile"
import { createDrizzleIdentityRepository } from "#identity/infrastructure/persistence/identity-drizzle-repository"
import { seedOwnerIdentity } from "#identity/infrastructure/persistence/seed"
import {
  adminIdentityProfiles,
  learnerProfiles,
  runIdentitySchemaMigration,
} from "#identity/infrastructure/persistence/schema"

const now = new Date("2026-07-22T00:00:00.000Z")

describe("identity SQLite repository", () => {
  it("legacy auth role과 삭제 profile을 identity 정책으로 한 번만 backfill한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)
      client.sqlite.exec(`
        CREATE TABLE learner_profiles (
          user_id TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'active',
          display_name TEXT,
          deleted_at INTEGER
        );
        INSERT INTO user (
          id, name, email, email_verified, image, created_at, updated_at
        ) VALUES (
          'deleted-user', '삭제 전 이름', 'deleted@example.com', 1, NULL,
          1784678400000, 1784678400000
        );
        INSERT INTO learner_profiles (
          user_id, status, display_name, deleted_at
        ) VALUES (
          'deleted-user', 'deleted', '삭제 전 이름', 1784678400000
        );
      `)

      const legacyAdminIdentities = [
        { id: "legacy-owner", role: "owner" },
      ] as const
      runIdentitySchemaMigration(client.sqlite, { legacyAdminIdentities })
      runIdentitySchemaMigration(client.sqlite, { legacyAdminIdentities })

      expect(client.db.select().from(adminIdentityProfiles).all()).toEqual([
        { adminId: "legacy-owner", role: "owner", version: 0 },
      ])
      expect(client.db.select().from(learnerProfiles).all()).toEqual([
        {
          deletedAt: now,
          displayName: deletedLearnerDisplayName,
          status: "deleted",
          userId: "deleted-user",
          version: 0,
        },
      ])
      expect(
        client.sqlite.query("PRAGMA foreign_key_list(learner_profiles)").all()
      ).toEqual([])
    } finally {
      client.close()
    }
  })

  it("profile provisioning과 optimistic status·role 변경을 통합 검증한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    const userId = userIdSchema.parse("user-1")
    const adminId = adminIdSchema.parse("admin-1")

    try {
      runBaselineMigration(client.sqlite)
      runIdentitySchemaMigration(client.sqlite)
      seedOwnerIdentity(client.db, adminId)
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

      const admin = await repository.findAdminIdentity(adminId)
      expect(admin).toMatchObject({ identity: { role: "owner" }, version: 0 })
      expect(
        (
          await repository.saveAdminIdentity({
            expectedVersion: admin?.version ?? -1,
            identity: { id: adminId, role: "operator" },
          })
        )._unsafeUnwrap()
      ).toMatchObject({ identity: { role: "operator" }, version: 1 })
      expect(
        (
          await repository.saveAdminIdentity({
            expectedVersion: admin?.version ?? -1,
            identity: { id: adminId, role: "operator" },
          })
        )._unsafeUnwrapErr()
      ).toEqual({ kind: "identity-conflict" })
    } finally {
      client.close()
    }
  })

  it("identity schema는 Better Auth table을 포함하지 않고 transaction rollback을 보존한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)
      runIdentitySchemaMigration(client.sqlite)

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
      expect(
        Object.keys({ adminIdentityProfiles, learnerProfiles }).sort()
      ).toEqual(["adminIdentityProfiles", "learnerProfiles"])
    } finally {
      client.close()
    }
  })
})
