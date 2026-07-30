import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import {
  aAiFeedbackAttempt,
  aAiFeedbackGlobalDailyCounter,
  ensurePurgeTestSchema,
} from "@workspace/ai-feedback/test-fixtures"
import { aPublishedCourse } from "@workspace/content/test-fixtures"
import { aLearner } from "@workspace/identity/test-fixtures"
import { aLearnerWithProgress } from "@workspace/learning/test-fixtures"

import { runDeletedLearnerPurge } from "@/scripts/purge-deleted-learners"

const now = new Date("2026-07-24T12:00:00.000Z")

describe("삭제 학습자 purge SQLite repository", () => {
  it("5일 경계의 사용자만 원자적으로 purge하고 재실행해도 content를 보존한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      preparePurgeDatabase(client.sqlite)
      expect(
        client.sqlite
          .query<{ readonly userId: string }, []>(
            "SELECT user_id AS userId FROM learner_lesson_progress"
          )
          .all()
      ).toEqual([{ userId: "eligible" }, { userId: "recent" }])
      expect(
        client.sqlite
          .query<{ readonly deletedAt: number; readonly userId: string }, []>(
            "SELECT user_id AS userId, deleted_at AS deletedAt FROM learner_profiles ORDER BY user_id"
          )
          .all()
      ).toEqual([
        { deletedAt: 1_784_462_400_000, userId: "eligible" },
        { deletedAt: 1_784_462_400_001, userId: "recent" },
      ])

      await expect(
        runDeletedLearnerPurge(client, { now: () => now })
      ).resolves.toEqual({
        cutoff: new Date("2026-07-19T12:00:00.000Z"),
        matchedUserCount: 1,
        purgedUserCount: 1,
      })
      await expect(
        runDeletedLearnerPurge(client, { now: () => now })
      ).resolves.toEqual({
        cutoff: new Date("2026-07-19T12:00:00.000Z"),
        matchedUserCount: 0,
        purgedUserCount: 0,
      })

      expect(readCount(client.sqlite, "user", "eligible")).toBe(0)
      expect(readCount(client.sqlite, "learner_profiles", "eligible")).toBe(0)
      expect(readCount(client.sqlite, "session", "eligible")).toBe(0)
      expect(readCount(client.sqlite, "account", "eligible")).toBe(0)
      expect(
        readCount(client.sqlite, "learner_course_progress", "eligible")
      ).toBe(0)
      expect(
        readCount(client.sqlite, "learner_lesson_progress", "eligible")
      ).toBe(0)
      expect(
        readCount(client.sqlite, "learner_lesson_answers", "eligible")
      ).toBe(0)
      expect(readCount(client.sqlite, "learner_step_drafts", "eligible")).toBe(
        0
      )
      expect(
        readCount(client.sqlite, "learner_activity_days", "eligible")
      ).toBe(0)
      expect(readCount(client.sqlite, "ai_feedback_attempts", "eligible")).toBe(
        0
      )
      expect(
        readCount(client.sqlite, "ai_feedback_user_daily_counters", "eligible")
      ).toBe(0)

      for (const table of [
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
      ]) {
        expect(readCount(client.sqlite, table, "recent"), table).toBe(1)
      }
      expect(readTableCount(client.sqlite, "courses")).toBe(1)
      expect(readTableCount(client.sqlite, "course_curriculum_versions")).toBe(
        1
      )
      expect(readTableCount(client.sqlite, "lesson_step_versions")).toBe(1)
      expect(
        readTableCount(client.sqlite, "ai_feedback_global_daily_counters")
      ).toBe(1)
    } finally {
      client.close()
    }
  })
})

function preparePurgeDatabase(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  runCurrentTestMigration(sqlite)
  ensurePurgeTestSchema(sqlite)

  const course = aPublishedCourse(sqlite)
  for (const learner of [
    {
      accountId: "account-eligible",
      deletedAt: 1_784_462_400_000,
      id: "eligible",
      name: "삭제 대상",
      sessionId: "session-eligible",
      sessionToken: "token-eligible",
      status: "deleted" as const,
      version: 1,
    },
    {
      accountId: "account-recent",
      deletedAt: 1_784_462_400_001,
      id: "recent",
      name: "보존 대상",
      sessionId: "session-recent",
      sessionToken: "token-recent",
      status: "deleted" as const,
      version: 1,
    },
  ]) {
    aLearner(sqlite, learner)
    aLearnerWithProgress(sqlite, { course, userId: learner.id })
    aAiFeedbackAttempt(sqlite, {
      attemptId: `attempt-${learner.id}`,
      course,
      idempotencyKey: `${learner.id}-key`,
      userId: learner.id,
    })
  }
  aAiFeedbackGlobalDailyCounter(sqlite, "2026-07-19")
}

function readCount(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  table: string,
  userId: string
): number {
  const userColumn = table === "user" ? "id" : "user_id"
  return (
    sqlite
      .query<{ readonly value: number }, [string]>(
        `SELECT COUNT(*) AS value FROM ${table} WHERE ${userColumn} = ?`
      )
      .get(userId)?.value ?? 0
  )
}

function readTableCount(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  table: string
): number {
  return (
    sqlite
      .query<{ readonly value: number }, []>(
        `SELECT COUNT(*) AS value FROM ${table}`
      )
      .get()?.value ?? 0
  )
}
