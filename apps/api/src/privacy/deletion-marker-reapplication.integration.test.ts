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
import { deletedLearnerDisplayName } from "@workspace/identity/ports"
import { aLearner } from "@workspace/identity/test-fixtures"
import { ok } from "@workspace/kernel/result"

import { runApplicationMigrations } from "@/db/migrate"
import { createDeletionMarkerReapplication } from "@/privacy/deletion-marker-reapplication"

const now = new Date("2026-07-24T12:00:00.000Z")
const snapshotAt = new Date("2026-07-10T00:00:00.000Z")
const alreadyDeletedAt = new Date("2026-07-21T00:00:00.000Z")
const recentDeletionRequestedAt = new Date("2026-07-22T00:00:00.000Z")

const expectedReapplication = {
  /** `already` 한 명이 이미 deleted 상태다. */
  alreadyAppliedUsers: 1,
  /** marker 7건 중 snapshot 이전인 `ignored` 1건을 제외한 수다. */
  markerCount: 6,
  /** `recent` 한 명이 새로 deleted로 표시된다. */
  markedDeletedUsers: 1,
  /** `boundary-missing`과 `missing` 두 명이 복구본에 없다. */
  missingUsers: 2,
  /** `old` 한 명은 보존 기간을 지나 purge된다. */
  purgedUsers: 1,
  snapshotAt,
  /** `recent` marker 2건이 한 사용자로 합쳐져 6건이 5명이 된다. */
  uniqueUserCount: 5,
} as const

const stateBeforeReapplication = {
  alreadySessionCount: 1,
  ignoredSessionCount: 1,
  oldUserCount: 1,
  recentDeletedAt: null,
  recentDisplayName: "최근 사용자",
  recentSessionCount: 1,
  recentStatus: "active",
} as const

const stateAfterReapplication = {
  alreadySessionCount: 0,
  ignoredSessionCount: 1,
  oldUserCount: 0,
  recentDeletedAt: recentDeletionRequestedAt.getTime(),
  recentDisplayName: deletedLearnerDisplayName,
  recentSessionCount: 0,
  recentStatus: "deleted",
} as const

describe("삭제 marker 재적용 실제 SQLite integration", () => {
  it("dry-run은 snapshot 이후 marker 집계만 보고하고 복구본을 바꾸지 않는다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      const reapplication = openReapplication(client)

      const preview = (
        await reapplication.execute({ batchSize: 2, dryRun: true, snapshotAt })
      )._unsafeUnwrap()

      expect(preview).toEqual({ ...expectedReapplication, dryRun: true })
      expect(readRestoreState(client)).toEqual(stateBeforeReapplication)
    } finally {
      client.close()
    }
  })

  it("actual 실행은 dry-run과 같은 집계로 삭제 표시·session 폐기·purge를 적용한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      const reapplication = openReapplication(client)

      const applied = (
        await reapplication.execute({ batchSize: 2, dryRun: false, snapshotAt })
      )._unsafeUnwrap()

      expect(applied).toEqual({ ...expectedReapplication, dryRun: false })
      expect(readRestoreState(client)).toEqual(stateAfterReapplication)
    } finally {
      client.close()
    }
  })

  it("재실행은 이미 반영된 사용자로 수렴하고 복구본을 더 바꾸지 않는다", async () => {
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

function openReapplication(client: WritingAppDatabaseClient) {
  runApplicationMigrations(client.sqlite)
  seedRestoreFixture(client)
  const markers = createMarkers()
  const markerStore: Pick<LearnerDeletionMarkerStorePort, "readAll"> = {
    readAll: async () => ok(markers),
  }

  return createDeletionMarkerReapplication({
    clock: { now: () => now },
    database: client.db,
    markerStore,
  })
}

function createMarkers(): readonly LearnerDeletionMarker[] {
  return [
    // snapshot 경계와 같은 시각이라 포함되지만 복구본에 사용자가 없다.
    aMarker("boundary-missing", snapshotAt),
    // 같은 사용자의 marker 2건이라 uniqueUserCount에서 하나로 합쳐진다.
    aMarker("recent", new Date("2026-07-23T00:00:00.000Z")),
    aMarker("recent", recentDeletionRequestedAt),
    // snapshot 이전이라 재적용 대상에서 제외된다.
    aMarker("ignored", new Date("2026-07-09T00:00:00.000Z")),
    // 삭제 요청이 보존 기간을 지나 purge 대상이다.
    aMarker("old", new Date("2026-07-18T00:00:00.000Z")),
    // 복구본이 이미 deleted로 반영한 사용자다.
    aMarker("already", recentDeletionRequestedAt),
    // 복구본에 사용자가 없다.
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
