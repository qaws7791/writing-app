import { describe, expect, it } from "vitest"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import type {
  LearnerDeletionMarker,
  LearnerDeletionMarkerStorePort,
} from "@workspace/identity/ports"
import {
  defaultDeletedLearnerRetentionDays,
  deletedLearnerDisplayName,
} from "@workspace/identity/ports"
import { aLearner } from "@workspace/identity/test-fixtures"
import { ok } from "@workspace/kernel/result"

import { runApplicationMigrations } from "@/db/migrate"
import { createDeletionMarkerReapplication } from "@/privacy/deletion-marker-reapplication"

const now = new Date("2026-07-24T12:00:00.000Z")
const snapshotAt = new Date("2026-07-10T00:00:00.000Z")
const alreadyDeletedAt = new Date("2026-07-21T00:00:00.000Z")
const recentDeletionRequestedAt = new Date("2026-07-22T00:00:00.000Z")

const stateAfterReapplication = {
  alreadySessionCount: 0,
  ignoredSessionCount: 1,
  oldUserCount: 0,
  recentDeletedAt: recentDeletionRequestedAt.getTime(),
  recentDisplayName: deletedLearnerDisplayName,
  recentSessionCount: 0,
  recentStatus: "deleted",
} as const

describe("deletion marker reapplication", () => {
  it("applies post-snapshot markers, revokes sessions, and physically purges expired learners", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      const reapplication = openReapplication(client)

      const applied = (
        await reapplication.execute({ batchSize: 2, dryRun: false, snapshotAt })
      )._unsafeUnwrap()

      expect(applied).toEqual({
        alreadyAppliedUsers: 1,
        dryRun: false,
        markerCount: 6,
        markedDeletedUsers: 1,
        missingUsers: 2,
        purgedUsers: 1,
        snapshotAt,
        uniqueUserCount: 5,
      })
      expect(readRestoreState(client)).toEqual(stateAfterReapplication)
    } finally {
      client.close()
    }
  })

  it("converges when the same marker set is applied again", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      const reapplication = openReapplication(client)
      await reapplication.execute({ batchSize: 2, dryRun: false, snapshotAt })

      const rerun = (
        await reapplication.execute({ batchSize: 2, dryRun: false, snapshotAt })
      )._unsafeUnwrap()

      expect(rerun).toMatchObject({
        alreadyAppliedUsers: 2,
        markedDeletedUsers: 0,
        missingUsers: 3,
        purgedUsers: 0,
      })
      expect(readRestoreState(client)).toEqual(stateAfterReapplication)
    } finally {
      client.close()
    }
  })
})

function openReapplication(client: WritingAppDatabaseClient) {
  runApplicationMigrations(client.sqlite)
  seedRestoreFixture(client)
  const markerStore: Pick<LearnerDeletionMarkerStorePort, "readAll"> = {
    readAll: async () => ok(createMarkers()),
  }

  return createDeletionMarkerReapplication({
    clock: { now: () => now },
    database: client.db,
    markerStore,
    retentionDays: defaultDeletedLearnerRetentionDays,
  })
}

function createMarkers(): readonly LearnerDeletionMarker[] {
  return [
    aMarker("boundary-missing", snapshotAt),
    aMarker("recent", new Date("2026-07-23T00:00:00.000Z")),
    aMarker("recent", recentDeletionRequestedAt),
    aMarker("ignored", new Date("2026-07-09T00:00:00.000Z")),
    aMarker("old", new Date("2026-07-18T00:00:00.000Z")),
    aMarker("already", recentDeletionRequestedAt),
    aMarker("missing", new Date("2026-07-23T00:00:00.000Z")),
  ]
}

function aMarker(userId: string, requestedAt: Date): LearnerDeletionMarker {
  return { requestedAt, userId: userIdSchema.parse(userId) }
}

function seedRestoreFixture(client: WritingAppDatabaseClient): void {
  aLearner(client.sqlite, {
    displayName: "오래된 사용자",
    email: "old@example.test",
    id: "old",
    sessionId: "session-old",
    sessionToken: "token-old",
    status: "active",
  })
  aLearner(client.sqlite, {
    displayName: "최근 사용자",
    email: "recent@example.test",
    id: "recent",
    sessionId: "session-recent",
    sessionToken: "token-recent",
    status: "active",
  })
  aLearner(client.sqlite, {
    deletedAt: alreadyDeletedAt.getTime(),
    displayName: deletedLearnerDisplayName,
    email: "already@example.test",
    id: "already",
    name: "이미 삭제",
    sessionId: "session-already",
    sessionToken: "token-already",
    status: "deleted",
    version: 1,
  })
  aLearner(client.sqlite, {
    displayName: "snapshot 전 사용자",
    email: "ignored@example.test",
    id: "ignored",
    sessionId: "session-ignored",
    sessionToken: "token-ignored",
    status: "active",
  })
}

function readRestoreState(client: WritingAppDatabaseClient) {
  const recent = client.sqlite
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
    alreadySessionCount: readUserRowCount(client, "session", "already"),
    ignoredSessionCount: readUserRowCount(client, "session", "ignored"),
    oldUserCount: readUserRowCount(client, "user", "old"),
    recentDeletedAt: recent?.deletedAt ?? null,
    recentDisplayName: recent?.displayName ?? null,
    recentSessionCount: readUserRowCount(client, "session", "recent"),
    recentStatus: recent?.status ?? null,
  }
}

function readUserRowCount(
  client: WritingAppDatabaseClient,
  table: "session" | "user",
  userId: string
): number {
  const column = table === "user" ? "id" : "user_id"
  return (
    client.sqlite
      .query<{ readonly value: number }, [string]>(
        `SELECT COUNT(*) AS value FROM ${table} WHERE ${column} = ?`
      )
      .get(userId)?.value ?? 0
  )
}
