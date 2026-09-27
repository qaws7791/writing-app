import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/test-support/d1-database"
import { type WritingAppDatabaseClient } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import type { LearnerDataPurgePort } from "@workspace/db/learner-data-purge"
import { aPublishedCourse } from "@workspace/content/test-fixtures"
import { createDeletedLearnerPurgeRepository } from "@workspace/identity/module"
import { deletedLearnerDisplayName } from "@workspace/identity/ports"
import { aLearner } from "@workspace/identity/test-fixtures"
import { aLearnerWithProgress } from "@workspace/learning/test-fixtures"
import { aWriting } from "@workspace/writing/test-fixtures"

import { learnerDataPurgePorts } from "@/privacy/learner-data-purge"
import { runDeletedLearnerPurge } from "@/scripts/purge-deleted-learners"

const now = new Date("2026-07-24T12:00:00.000Z")
const retentionDays = 5
const dayMs = 86_400_000
const purgeCutoff = new Date(now.getTime() - retentionDays * dayMs)

const learnerOwnedTableNames = [
  "user",
  "learner_profiles",
  "session",
  "account",
  "verification",
  "learner_course_progress",
  "learner_lesson_progress",
  "learner_lesson_answers",
  "learner_step_drafts",
  "learner_activity_days",
  "writings",
  "writing_events",
  "writing_ai_notices",
] as const

describe("삭제 학습자 purge SQLite integration", () => {
  it("cutoff 이하의 사용자 소유 데이터만 삭제하고 최근 사용자와 공유 데이터를 보존한다", async () => {
    const client = await createInMemoryWritingAppDatabase()

    try {
      await preparePurgeDatabase(client)

      const result = await runDeletedLearnerPurge(
        client,
        { now: () => now },
        retentionDays
      )

      expect(result).toEqual({
        cutoff: purgeCutoff,
        matchedUserCount: 1,
        purgedUserCount: 1,
      })
      expect(await readLearnerRowCounts(client, "eligible")).toEqual(
        expectedRowCounts(0)
      )
      expect(await readLearnerRowCounts(client, "recent")).toEqual(
        expectedRowCounts(1)
      )
      expect(await readSharedRowCounts(client)).toEqual({
        courses: 1,
        curriculumVersions: 1,
        lessonSteps: 1,
      })
    } finally {
      await client.close()
    }
  })

  it("중간 module purge 실패 시 writing을 포함한 모든 사용자 데이터를 rollback한다", async () => {
    const client = await createInMemoryWritingAppDatabase()

    try {
      await runCurrentTestMigration(client.sqlite)
      const course = await aPublishedCourse(client.sqlite)
      await seedDeletedLearner(client, {
        course,
        deletedAt: purgeCutoff.getTime(),
        id: "rollback-user",
      })
      const repository = createDeletedLearnerPurgeRepository({
        database: client.db,
        learnerDataPurges: [...learnerDataPurgePorts, failingPurgePort],
      })

      const result = await repository.purgeDeletedBefore({
        batchSize: 10,
        cutoff: purgeCutoff,
        dryRun: false,
      })

      expect(result._unsafeUnwrapErr()).toMatchObject({
        kind: "deleted-learner-purge-failed",
      })
      expect(await readLearnerRowCounts(client, "rollback-user")).toEqual(
        expectedRowCounts(1)
      )
      expect(await readSharedRowCounts(client)).toMatchObject({
        courses: 1,
        curriculumVersions: 1,
        lessonSteps: 1,
      })
    } finally {
      await client.close()
    }
  })
})

const failingPurgePort = {
  moduleName: "failing-test-module",
  statements() {
    throw new Error("purge fixture failed")
  },
} satisfies LearnerDataPurgePort

async function preparePurgeDatabase(
  client: WritingAppDatabaseClient
): Promise<void> {
  await runCurrentTestMigration(client.sqlite)
  const course = await aPublishedCourse(client.sqlite)

  await seedDeletedLearner(client, {
    course,
    deletedAt: purgeCutoff.getTime(),
    id: "eligible",
  })
  await seedDeletedLearner(client, {
    course,
    deletedAt: purgeCutoff.getTime() + 1,
    id: "recent",
  })
}

async function seedDeletedLearner(
  client: WritingAppDatabaseClient,
  input: Readonly<{
    course: Awaited<ReturnType<typeof aPublishedCourse>>
    deletedAt: number
    id: string
  }>
): Promise<void> {
  const email = `${input.id}@example.test`
  await aLearner(client.sqlite, {
    accountId: `account-${input.id}`,
    deletedAt: input.deletedAt,
    displayName: deletedLearnerDisplayName,
    email,
    id: input.id,
    sessionId: `session-${input.id}`,
    sessionToken: `token-${input.id}`,
    status: "deleted",
    version: 1,
  })
  await client.sqlite
    .query<void, [string, string, string, number]>(
      `INSERT INTO verification (
        id, identifier, value, expires_at, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, 1, 1)`
    )
    .run(
      `verification-${input.id}`,
      email,
      `verification-token-${input.id}`,
      now.getTime() + dayMs
    )
  await client.sqlite
    .query<void, [string, string, string, number]>(
      `INSERT INTO verification (
        id, identifier, value, expires_at, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, 1, 1)`
    )
    .run(
      `reset-verification-${input.id}`,
      `reset-password:reset-token-${input.id}`,
      input.id,
      now.getTime() + dayMs
    )
  await aLearnerWithProgress(client.sqlite, {
    course: input.course,
    userId: input.id,
  })
  await aWriting(client.sqlite, {
    id: `writing-${input.id}`,
    userId: input.id,
  })
  await client.sqlite
    .query<void, [string]>(
      `INSERT INTO writing_ai_notices (user_id, acknowledged_at) VALUES (?1, 1)`
    )
    .run(input.id)
}

function expectedRowCounts(count: number): Readonly<Record<string, number>> {
  return Object.fromEntries(
    learnerOwnedTableNames.map((table) => [
      table,
      table === "verification" ? count * 2 : count,
    ])
  )
}

async function readLearnerRowCounts(
  client: WritingAppDatabaseClient,
  userId: string
): Promise<Readonly<Record<string, number>>> {
  return Object.fromEntries(
    await Promise.all(
      learnerOwnedTableNames.map(async (table) => [
        table,
        await readUserRowCount(client, table, userId),
      ])
    )
  )
}

async function readUserRowCount(
  client: WritingAppDatabaseClient,
  table: (typeof learnerOwnedTableNames)[number],
  userId: string
): Promise<number> {
  if (table === "verification") {
    return (
      (
        await client.sqlite
          .query<{ readonly value: number }, [string, string]>(
            `SELECT COUNT(*) AS value
           FROM verification
           WHERE identifier = ?1 OR value = ?2`
          )
          .get(`${userId}@example.test`, userId)
      )?.value ?? 0
    )
  }
  const userColumn = table === "user" ? "id" : "user_id"
  return (
    (
      await client.sqlite
        .query<{ readonly value: number }, [string]>(
          `SELECT COUNT(*) AS value FROM ${table} WHERE ${userColumn} = ?`
        )
        .get(userId)
    )?.value ?? 0
  )
}

async function readSharedRowCounts(client: WritingAppDatabaseClient) {
  return {
    courses: await readTableCount(client, "courses"),
    curriculumVersions: await readTableCount(
      client,
      "course_curriculum_versions"
    ),
    lessonSteps: await readTableCount(client, "lesson_step_versions"),
  }
}

async function readTableCount(
  client: WritingAppDatabaseClient,
  table: string
): Promise<number> {
  return (
    (
      await client.sqlite
        .query<{ readonly value: number }, []>(
          `SELECT COUNT(*) AS value FROM ${table}`
        )
        .get()
    )?.value ?? 0
  )
}
