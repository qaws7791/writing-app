import { describe, expect, it } from "vitest"

import { createInMemoryKwepDatabase } from "@/client"
import { runBaselineMigration } from "@/migrations/migrate"

describe("Kwep DB client", () => {
  it("in-memory SQLite DB에 새 baseline schema를 적용한다", () => {
    const client = createInMemoryKwepDatabase()

    try {
      runBaselineMigration(client.sqlite)

      const tableNames = client.sqlite
        .query<{ readonly name: string }, []>(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        .all()
        .map((row) => row.name)

      expect(tableNames).toEqual([
        "admin_auth_accounts",
        "admin_auth_sessions",
        "admin_auth_users",
        "admin_auth_verifications",
        "ai_feedback_attempts",
        "auth_accounts",
        "auth_sessions",
        "auth_users",
        "auth_verifications",
        "course_units",
        "courses",
        "learner_activity_days",
        "learner_lesson_answers",
        "learner_lesson_progress",
        "learner_profiles",
        "lesson_steps",
        "lessons",
      ])

      const lessonForeignKeys = client.sqlite
        .query<{ readonly table: string }, []>(
          "PRAGMA foreign_key_list(lessons)"
        )
        .all()
        .map((row) => row.table)
        .sort()

      expect(lessonForeignKeys).toEqual(["course_units", "courses"])
    } finally {
      client.close()
    }
  })
})
