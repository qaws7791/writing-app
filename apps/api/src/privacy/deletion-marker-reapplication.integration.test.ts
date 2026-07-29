import { describe, expect, it } from "vitest"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import type {
  LearnerDeletionMarker,
  LearnerDeletionMarkerStorePort,
} from "@workspace/identity/ports"
import { deletedLearnerDisplayName } from "@workspace/identity/ports"
import { ok } from "@workspace/kernel/result"

import { runApplicationMigrations } from "@/db/migrate"
import { createDeletionMarkerReapplication } from "@/privacy/deletion-marker-reapplication"

const now = new Date("2026-07-24T12:00:00.000Z")
const snapshotAt = new Date("2026-07-10T00:00:00.000Z")

describe("삭제 marker 재적용 실제 SQLite integration", () => {
  it("snapshot 이후 marker를 dry-run과 동일하게 재적용하고 재실행을 안전하게 수렴시킨다", async () => {
    const client = createInMemoryWritingAppDatabase()
    const markers = createMarkers()
    const markerStore: Pick<LearnerDeletionMarkerStorePort, "readAll"> = {
      readAll: async () => ok(markers),
    }

    try {
      runApplicationMigrations(client.sqlite)
      seedRestoreFixture(client.sqlite)
      const reapplication = createDeletionMarkerReapplication({
        clock: { now: () => now },
        database: client.db,
        markerStore,
      })

      const preview = await reapplication.execute({
        batchSize: 2,
        dryRun: true,
        snapshotAt,
      })
      expect(preview.isOk()).toBe(true)
      if (preview.isErr()) throw new Error(preview.error.stage)
      expect(preview.value).toEqual({
        alreadyAppliedUsers: 1,
        dryRun: true,
        markerCount: 6,
        markedDeletedUsers: 1,
        missingUsers: 2,
        purgedUsers: 1,
        snapshotAt,
        uniqueUserCount: 5,
      })
      expect(readRestoreState(client.sqlite)).toEqual({
        alreadySessionCount: 1,
        ignoredSessionCount: 1,
        oldUserCount: 1,
        recentDeletedAt: null,
        recentDisplayName: "최근 사용자",
        recentSessionCount: 1,
        recentStatus: "active",
      })

      const applied = await reapplication.execute({
        batchSize: 2,
        dryRun: false,
        snapshotAt,
      })
      expect(applied.isOk()).toBe(true)
      if (applied.isErr()) throw new Error(applied.error.stage)
      expect(applied.value).toEqual({
        ...preview.value,
        dryRun: false,
      })
      expect(readRestoreState(client.sqlite)).toEqual({
        alreadySessionCount: 0,
        ignoredSessionCount: 1,
        oldUserCount: 0,
        recentDeletedAt: new Date("2026-07-22T00:00:00.000Z").getTime(),
        recentDisplayName: deletedLearnerDisplayName,
        recentSessionCount: 0,
        recentStatus: "deleted",
      })

      const rerun = await reapplication.execute({
        batchSize: 2,
        dryRun: false,
        snapshotAt,
      })
      expect(rerun.isOk()).toBe(true)
      if (rerun.isErr()) throw new Error(rerun.error.stage)
      expect(rerun.value).toMatchObject({
        alreadyAppliedUsers: 2,
        markedDeletedUsers: 0,
        missingUsers: 3,
        purgedUsers: 0,
      })
      expect(readRestoreState(client.sqlite)).toEqual({
        alreadySessionCount: 0,
        ignoredSessionCount: 1,
        oldUserCount: 0,
        recentDeletedAt: new Date("2026-07-22T00:00:00.000Z").getTime(),
        recentDisplayName: deletedLearnerDisplayName,
        recentSessionCount: 0,
        recentStatus: "deleted",
      })
    } finally {
      client.close()
    }
  })

  it("현재보다 미래인 snapshot은 marker를 읽기 전에 fail-closed한다", async () => {
    let readCount = 0
    const client = createInMemoryWritingAppDatabase()
    try {
      runApplicationMigrations(client.sqlite)
      const reapplication = createDeletionMarkerReapplication({
        clock: { now: () => now },
        database: client.db,
        markerStore: {
          readAll: async () => {
            readCount += 1
            return ok([])
          },
        },
      })

      await expect(
        reapplication.execute({
          batchSize: 100,
          dryRun: true,
          snapshotAt: new Date(now.getTime() + 1),
        })
      ).resolves.toMatchObject({
        error: {
          kind: "deletion-marker-reapplication-failed",
          stage: "input",
        },
      })
      expect(readCount).toBe(0)
    } finally {
      client.close()
    }
  })
})

function createMarkers(): readonly LearnerDeletionMarker[] {
  return [
    {
      requestedAt: new Date("2026-07-10T00:00:00.000Z"),
      userId: userIdSchema.parse("boundary-missing"),
    },
    {
      requestedAt: new Date("2026-07-23T00:00:00.000Z"),
      userId: userIdSchema.parse("recent"),
    },
    {
      requestedAt: new Date("2026-07-09T00:00:00.000Z"),
      userId: userIdSchema.parse("ignored"),
    },
    {
      requestedAt: new Date("2026-07-18T00:00:00.000Z"),
      userId: userIdSchema.parse("old"),
    },
    {
      requestedAt: new Date("2026-07-22T00:00:00.000Z"),
      userId: userIdSchema.parse("recent"),
    },
    {
      requestedAt: new Date("2026-07-22T00:00:00.000Z"),
      userId: userIdSchema.parse("already"),
    },
    {
      requestedAt: new Date("2026-07-23T00:00:00.000Z"),
      userId: userIdSchema.parse("missing"),
    },
  ]
}

function seedRestoreFixture(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    INSERT INTO user (
      id, name, email, email_verified, image, created_at, updated_at
    ) VALUES
      ('old', '오래된 사용자', 'old@example.test', 1, NULL, 1, 1),
      ('recent', '최근 사용자', 'recent@example.test', 1, NULL, 1, 1),
      ('already', '이미 삭제', 'already@example.test', 1, NULL, 1, 1),
      ('ignored', 'snapshot 전 사용자', 'ignored@example.test', 1, NULL, 1, 1);
    INSERT INTO learner_profiles (
      user_id, status, display_name, deleted_at, version
    ) VALUES
      ('old', 'active', '오래된 사용자', NULL, 0),
      ('recent', 'active', '최근 사용자', NULL, 0),
      ('already', 'deleted', '${deletedLearnerDisplayName}', 1784592000000, 1),
      ('ignored', 'active', 'snapshot 전 사용자', NULL, 0);
    INSERT INTO session (
      id, user_id, token, expires_at, created_at, updated_at
    ) VALUES
      ('session-old', 'old', 'token-old', 4102444800000, 1, 1),
      ('session-recent', 'recent', 'token-recent', 4102444800000, 1, 1),
      ('session-already', 'already', 'token-already', 4102444800000, 1, 1),
      ('session-ignored', 'ignored', 'token-ignored', 4102444800000, 1, 1);
  `)
}

function readRestoreState(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
) {
  const recent = sqlite
    .query<
      {
        readonly deletedAt: number | null
        readonly displayName: string
        readonly status: string
      },
      []
    >(
      "SELECT deleted_at AS deletedAt, display_name AS displayName, status FROM learner_profiles WHERE user_id = 'recent'"
    )
    .get()

  return {
    alreadySessionCount: readUserRowCount(sqlite, "session", "already"),
    ignoredSessionCount: readUserRowCount(sqlite, "session", "ignored"),
    oldUserCount: readUserRowCount(sqlite, "user", "old"),
    recentDeletedAt: recent?.deletedAt ?? null,
    recentDisplayName: recent?.displayName ?? null,
    recentSessionCount: readUserRowCount(sqlite, "session", "recent"),
    recentStatus: recent?.status ?? null,
  }
}

function readUserRowCount(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  table: "session" | "user",
  userId: string
): number {
  const column = table === "user" ? "id" : "user_id"
  return (
    sqlite
      .query<{ readonly value: number }, [string]>(
        `SELECT COUNT(*) AS value FROM ${table} WHERE ${column} = ?`
      )
      .get(userId)?.value ?? 0
  )
}
