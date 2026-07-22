import type { Database } from "bun:sqlite"

const requiredColumns = [
  "answer_text",
  "attempt_number",
  "course_id",
  "created_at",
  "curriculum_version_id",
  "expires_at",
  "id",
  "idempotency_key",
  "lesson_id",
  "result_json",
  "status",
  "step_id",
  "updated_at",
  "user_id",
] as const

const createTableSql = `
CREATE TABLE ai_feedback_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  curriculum_version_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'expired')),
  answer_text TEXT NOT NULL,
  result_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
`

const createIndexesSql = `
CREATE UNIQUE INDEX IF NOT EXISTS ai_feedback_attempts_idempotency_idx
ON ai_feedback_attempts(user_id, curriculum_version_id, lesson_id, step_id, idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS ai_feedback_attempts_active_slot_idx
ON ai_feedback_attempts(user_id, curriculum_version_id, lesson_id, step_id, attempt_number)
WHERE status IN ('pending', 'succeeded');

CREATE UNIQUE INDEX IF NOT EXISTS ai_feedback_attempts_pending_idx
ON ai_feedback_attempts(user_id, curriculum_version_id, lesson_id, step_id)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS ai_feedback_attempts_expiry_idx
ON ai_feedback_attempts(status, expires_at);
`

export function runAiFeedbackSchemaMigration(sqlite: Database): void {
  if (!hasTable(sqlite, "ai_feedback_attempts")) return

  assertAiFeedbackMigrationPrerequisites(sqlite)
  const foreignKeys = sqlite
    .query<unknown, []>("PRAGMA foreign_key_list(ai_feedback_attempts)")
    .all()

  if (foreignKeys.length === 0) {
    sqlite.exec(createIndexesSql)
    return
  }

  sqlite.exec("BEGIN IMMEDIATE")
  try {
    sqlite.exec(`
ALTER TABLE ai_feedback_attempts RENAME TO ai_feedback_attempts_legacy_p6;
${createTableSql}
INSERT INTO ai_feedback_attempts (
  id,
  user_id,
  course_id,
  curriculum_version_id,
  lesson_id,
  step_id,
  attempt_number,
  idempotency_key,
  status,
  answer_text,
  result_json,
  created_at,
  updated_at,
  expires_at
)
SELECT
  id,
  user_id,
  course_id,
  curriculum_version_id,
  lesson_id,
  step_id,
  attempt_number,
  idempotency_key,
  status,
  answer_text,
  result_json,
  created_at,
  updated_at,
  expires_at
FROM ai_feedback_attempts_legacy_p6;
DROP TABLE ai_feedback_attempts_legacy_p6;
${createIndexesSql}
`)
    sqlite.exec("COMMIT")
  } catch (error) {
    sqlite.exec("ROLLBACK")
    throw error
  }
}

export function assertAiFeedbackMigrationPrerequisites(sqlite: Database): void {
  if (!hasTable(sqlite, "ai_feedback_attempts")) return

  const columns = new Set(
    sqlite
      .query<{ readonly name: string }, []>(
        "PRAGMA table_info(ai_feedback_attempts)"
      )
      .all()
      .map(({ name }) => name)
  )
  const missingColumns = requiredColumns.filter(
    (column) => !columns.has(column)
  )
  if (missingColumns.length > 0) {
    throw new Error(
      `AI feedback migration prerequisite failed: missing columns ${missingColumns.join(", ")}`
    )
  }

  const invalidAttempt = sqlite
    .query<{ readonly id: string }, []>(`
      SELECT id
      FROM ai_feedback_attempts
      WHERE user_id = ''
        OR course_id = ''
        OR curriculum_version_id = ''
        OR lesson_id = ''
        OR step_id = ''
        OR attempt_number <= 0
        OR status NOT IN ('pending', 'succeeded', 'failed', 'expired')
      LIMIT 1
    `)
    .get()
  if (invalidAttempt !== null) {
    throw new Error(
      `AI feedback migration prerequisite failed: invalid attempt ${invalidAttempt.id}`
    )
  }

  for (const check of crossModuleReferenceChecks) {
    if (!check.requiredTables.every((table) => hasTable(sqlite, table)))
      continue
    const orphan = sqlite.query<{ readonly id: string }, []>(check.query).get()
    if (orphan !== null) {
      throw new Error(
        `AI feedback migration prerequisite failed: ${check.description} ${orphan.id}`
      )
    }
  }
}

const crossModuleReferenceChecks = [
  {
    description: "unknown learner",
    query: `
      SELECT attempt.id
      FROM ai_feedback_attempts attempt
      LEFT JOIN user learner ON learner.id = attempt.user_id
      WHERE learner.id IS NULL
      LIMIT 1
    `,
    requiredTables: ["user"],
  },
  {
    description: "unknown learning scope",
    query: `
      SELECT attempt.id
      FROM ai_feedback_attempts attempt
      LEFT JOIN learner_course_progress progress
        ON progress.user_id = attempt.user_id
        AND progress.course_id = attempt.course_id
        AND progress.curriculum_version_id = attempt.curriculum_version_id
      WHERE progress.user_id IS NULL
      LIMIT 1
    `,
    requiredTables: ["learner_course_progress"],
  },
  {
    description: "unknown feedback step",
    query: `
      SELECT attempt.id
      FROM ai_feedback_attempts attempt
      LEFT JOIN lesson_step_versions step
        ON step.curriculum_version_id = attempt.curriculum_version_id
        AND step.lesson_id = attempt.lesson_id
        AND step.id = attempt.step_id
      WHERE step.id IS NULL
      LIMIT 1
    `,
    requiredTables: ["lesson_step_versions"],
  },
] as const

function hasTable(sqlite: Database, tableName: string): boolean {
  return (
    sqlite
      .query<{ readonly value: number }, [string]>(
        "SELECT 1 AS value FROM sqlite_master WHERE type = 'table' AND name = ?"
      )
      .get(tableName) !== null
  )
}
