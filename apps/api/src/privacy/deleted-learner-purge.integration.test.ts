import { describe, expect, it } from "vitest"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import {
  aAiFeedbackAttempt,
  aAiFeedbackGlobalDailyCounter,
} from "@workspace/ai-feedback/test-fixtures"
import { aPublishedCourse } from "@workspace/content/test-fixtures"
import { aLearner } from "@workspace/identity/test-fixtures"
import { aLearnerWithProgress } from "@workspace/learning/test-fixtures"

import { runDeletedLearnerPurge } from "@/scripts/purge-deleted-learners"

const now = new Date("2026-07-24T12:00:00.000Z")
const retentionDays = 5
const dayMs = 86_400_000
const purgeCutoff = new Date(now.getTime() - retentionDays * dayMs)

/** purge 대상 테이블 전체 — 하나라도 남으면 개인정보가 남는다. */
const learnerOwnedTableNames = [
  "user",
  "learner_profiles",
  "session",
  "account",
  "learner_course_progress",
  "learner_lesson_progress",
  "learner_lesson_answers",
  "learner_step_drafts",
  "learner_activity_days",
  "ai_feedback_attempts",
  "ai_feedback_user_daily_counters",
] as const

describe("삭제 학습자 purge SQLite repository", () => {
  it("cutoff 이하로 삭제된 학습자만 모든 table에서 제거하고 최근 삭제 학습자는 보존한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      preparePurgeDatabase(client)

      await expect(
        runDeletedLearnerPurge(client, { now: () => now })
      ).resolves.toEqual({
        cutoff: purgeCutoff,
        matchedUserCount: 1,
        purgedUserCount: 1,
      })

      expect(readLearnerRowCounts(client, "eligible")).toEqual(
        expectedRowCounts(0)
      )
      expect(readLearnerRowCounts(client, "recent")).toEqual(
        expectedRowCounts(1)
      )
    } finally {
      client.close()
    }
  })

  it("재실행은 대상이 없다고 보고하고 공유 content를 보존한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      preparePurgeDatabase(client)
      await runDeletedLearnerPurge(client, { now: () => now })

      await expect(
        runDeletedLearnerPurge(client, { now: () => now })
      ).resolves.toEqual({
        cutoff: purgeCutoff,
        matchedUserCount: 0,
        purgedUserCount: 0,
      })

      expect(readTableCount(client, "courses")).toBe(1)
      expect(readTableCount(client, "course_curriculum_versions")).toBe(1)
      expect(readTableCount(client, "lesson_step_versions")).toBe(1)
      expect(readTableCount(client, "ai_feedback_global_daily_counters")).toBe(
        1
      )
    } finally {
      client.close()
    }
  })
})

function preparePurgeDatabase(client: WritingAppDatabaseClient): void {
  runCurrentTestMigration(client.sqlite)

  const course = aPublishedCourse(client.sqlite)
  for (const learner of [
    {
      accountId: "account-eligible",
      deletedAt: purgeCutoff.getTime(),
      id: "eligible",
      name: "삭제 대상",
      sessionId: "session-eligible",
      sessionToken: "token-eligible",
      status: "deleted" as const,
      version: 1,
    },
    {
      accountId: "account-recent",
      deletedAt: purgeCutoff.getTime() + 1,
      id: "recent",
      name: "보존 대상",
      sessionId: "session-recent",
      sessionToken: "token-recent",
      status: "deleted" as const,
      version: 1,
    },
  ]) {
    aLearner(client.sqlite, learner)
    aLearnerWithProgress(client.sqlite, { course, userId: learner.id })
    aAiFeedbackAttempt(client.sqlite, {
      attemptId: `attempt-${learner.id}`,
      course,
      idempotencyKey: `${learner.id}-key`,
      userId: learner.id,
    })
  }
  aAiFeedbackGlobalDailyCounter(client.sqlite, "2026-07-19")
}

function expectedRowCounts(count: number): Readonly<Record<string, number>> {
  return Object.fromEntries(
    learnerOwnedTableNames.map((table) => [table, count])
  )
}

function readLearnerRowCounts(
  client: WritingAppDatabaseClient,
  userId: string
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    learnerOwnedTableNames.map((table) => [
      table,
      readUserRowCount(client, table, userId),
    ])
  )
}

function readUserRowCount(
  client: WritingAppDatabaseClient,
  table: string,
  userId: string
): number {
  const userColumn = table === "user" ? "id" : "user_id"
  return (
    client.sqlite
      .query<{ readonly value: number }, [string]>(
        `SELECT COUNT(*) AS value FROM ${table} WHERE ${userColumn} = ?`
      )
      .get(userId)?.value ?? 0
  )
}

function readTableCount(
  client: WritingAppDatabaseClient,
  table: string
): number {
  return (
    client.sqlite
      .query<{ readonly value: number }, []>(
        `SELECT COUNT(*) AS value FROM ${table}`
      )
      .get()?.value ?? 0
  )
}
