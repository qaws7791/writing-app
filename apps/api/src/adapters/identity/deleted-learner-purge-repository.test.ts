import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"

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
  addAiFeedbackAttemptColumn(sqlite, "input_token_count", "INTEGER")
  addAiFeedbackAttemptColumn(sqlite, "latency_ms", "INTEGER")
  addAiFeedbackAttemptColumn(sqlite, "model", "TEXT NOT NULL DEFAULT 'legacy'")
  addAiFeedbackAttemptColumn(sqlite, "output_token_count", "INTEGER")
  addAiFeedbackAttemptColumn(
    sqlite,
    "prompt_policy_version",
    "TEXT NOT NULL DEFAULT 'legacy'"
  )
  addAiFeedbackAttemptColumn(
    sqlite,
    "quota_date",
    "TEXT NOT NULL DEFAULT '1970-01-01'"
  )
  addAiFeedbackAttemptColumn(sqlite, "failure_code", "TEXT")

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS learner_step_drafts (
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      curriculum_version_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      step_id TEXT NOT NULL,
      answer_json TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (
        user_id, course_id, curriculum_version_id, lesson_id, step_id
      ),
      FOREIGN KEY (user_id, course_id, curriculum_version_id)
        REFERENCES learner_course_progress(
          user_id, course_id, curriculum_version_id
        ) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS ai_feedback_user_daily_counters (
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
      quota_date TEXT NOT NULL,
      request_count INTEGER NOT NULL,
      success_count INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, quota_date)
    );
    CREATE TABLE IF NOT EXISTS ai_feedback_global_daily_counters (
      quota_date TEXT PRIMARY KEY NOT NULL,
      request_count INTEGER NOT NULL,
      success_count INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    INSERT INTO courses (
      id, status, sort_order, published_curriculum_version_id, created_at
    ) VALUES ('course-1', 'active', 1, NULL, 1);
    INSERT INTO course_curriculum_versions (
      id, course_id, revision, edit_version, status, title, description,
      category, visual_key, created_at, updated_at, published_at
    ) VALUES (
      'version-1', 'course-1', 1, 0, 'draft', '코스', '설명',
      '기초', 'basic-sentence-writing', 1, 1, NULL
    );
    INSERT INTO course_unit_versions (
      curriculum_version_id, id, title, status, sort_order
    ) VALUES ('version-1', 'unit-1', '단원', 'active', 1);
    INSERT INTO lesson_versions (
      curriculum_version_id, id, unit_id, title, description, category,
      summary_json, estimated_minutes, status, sort_order
    ) VALUES (
      'version-1', 'lesson-1', 'unit-1', '레슨', NULL, NULL,
      '[]', 5, 'active', 1
    );
    INSERT INTO lesson_step_versions (
      curriculum_version_id, id, lesson_id, type, content_json, status,
      sort_order
    ) VALUES (
      'version-1', 'step-1', 'lesson-1', 'AI_FEEDBACK', '{}', 'active', 1
    );
    UPDATE course_curriculum_versions
    SET status = 'published', published_at = 1
    WHERE id = 'version-1';
    UPDATE courses
    SET published_curriculum_version_id = 'version-1'
    WHERE id = 'course-1';

    INSERT INTO user (
      id, name, email, email_verified, image, created_at, updated_at
    ) VALUES
      ('eligible', '삭제 대상', 'eligible@example.test', 1, NULL, 1, 1),
      ('recent', '보존 대상', 'recent@example.test', 1, NULL, 1, 1);
    INSERT INTO learner_profiles (
      user_id, status, display_name, deleted_at, version
    ) VALUES
      ('eligible', 'deleted', '삭제된 사용자', 1784462400000, 1),
      ('recent', 'deleted', '삭제된 사용자', 1784462400001, 1);
    INSERT INTO session (
      id, user_id, token, expires_at, created_at, updated_at
    ) VALUES
      ('session-eligible', 'eligible', 'token-eligible', 4102444800000, 1, 1),
      ('session-recent', 'recent', 'token-recent', 4102444800000, 1, 1);
    INSERT INTO account (
      id, user_id, account_id, provider_id, created_at, updated_at
    ) VALUES
      ('account-eligible', 'eligible', 'eligible', 'credential', 1, 1),
      ('account-recent', 'recent', 'recent', 'credential', 1, 1);

    INSERT INTO learner_course_progress (
      user_id, course_id, curriculum_version_id, status, started_at,
      completed_at, last_activity_at, updated_at
    ) VALUES
      ('eligible', 'course-1', 'version-1', 'in_progress', 1, NULL, 1, 1),
      ('recent', 'course-1', 'version-1', 'in_progress', 1, NULL, 1, 1);
    INSERT INTO learner_lesson_progress (
      user_id, course_id, curriculum_version_id, lesson_id, current_step_id,
      status, started_at, completed_at, updated_at
    ) VALUES
      (
        'eligible', 'course-1', 'version-1', 'lesson-1', 'step-1',
        'in_progress', 1, NULL, 1
      ),
      (
        'recent', 'course-1', 'version-1', 'lesson-1', 'step-1',
        'in_progress', 1, NULL, 1
      );
    INSERT INTO learner_lesson_answers (
      user_id, course_id, curriculum_version_id, lesson_id, step_id,
      answer_json, answered_at, updated_at
    ) VALUES
      (
        'eligible', 'course-1', 'version-1', 'lesson-1', 'step-1',
        '{"text":"answer"}', 1, 1
      ),
      (
        'recent', 'course-1', 'version-1', 'lesson-1', 'step-1',
        '{"text":"answer"}', 1, 1
      );
    INSERT INTO learner_step_drafts (
      user_id, course_id, curriculum_version_id, lesson_id, step_id,
      answer_json, version, updated_at
    ) VALUES
      (
        'eligible', 'course-1', 'version-1', 'lesson-1', 'step-1',
        '{"text":"draft"}', 0, 1
      ),
      (
        'recent', 'course-1', 'version-1', 'lesson-1', 'step-1',
        '{"text":"draft"}', 0, 1
      );
    INSERT INTO learner_activity_days (
      user_id, activity_date, first_activity_at, last_activity_at,
      completed_lessons, saved_answers
    ) VALUES
      ('eligible', '2026-07-01', 1, 1, 0, 1),
      ('recent', '2026-07-01', 1, 1, 0, 1);

    INSERT INTO ai_feedback_attempts (
      id, user_id, course_id, curriculum_version_id, lesson_id, step_id,
      attempt_number, idempotency_key, status, answer_text, result_json,
      created_at, updated_at, expires_at, input_token_count, latency_ms,
      model, output_token_count, prompt_policy_version, quota_date,
      failure_code
    ) VALUES
      (
        'attempt-eligible', 'eligible', 'course-1', 'version-1', 'lesson-1',
        'step-1', 1, 'eligible-key', 'failed', 'answer', NULL, 1, 1, 2,
        NULL, 1, 'gpt-test', NULL, 'writing-coach-v1', '2026-07-19',
        'provider-unavailable'
      ),
      (
        'attempt-recent', 'recent', 'course-1', 'version-1', 'lesson-1',
        'step-1', 1, 'recent-key', 'failed', 'answer', NULL, 1, 1, 2,
        NULL, 1, 'gpt-test', NULL, 'writing-coach-v1', '2026-07-19',
        'provider-unavailable'
      );
    INSERT INTO ai_feedback_user_daily_counters (
      user_id, quota_date, request_count, success_count, updated_at
    ) VALUES
      ('eligible', '2026-07-19', 1, 0, 1),
      ('recent', '2026-07-19', 1, 0, 1);
    INSERT INTO ai_feedback_global_daily_counters (
      quota_date, request_count, success_count, updated_at
    ) VALUES ('2026-07-19', 2, 0, 1);
  `)
}

function addAiFeedbackAttemptColumn(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  column: string,
  definition: string
): void {
  const columns = sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM pragma_table_info('ai_feedback_attempts')"
    )
    .all()
  if (columns.some(({ name }) => name === column)) return

  sqlite.exec(
    `ALTER TABLE ai_feedback_attempts ADD COLUMN ${column} ${definition}`
  )
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
