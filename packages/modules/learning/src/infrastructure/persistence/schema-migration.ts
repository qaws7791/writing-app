import type { Database } from "bun:sqlite"

const learningTables = [
  "learner_activity_days",
  "learner_course_progress",
  "learner_lesson_progress",
  "learner_lesson_answers",
] as const

const createLearningTablesSql = `
CREATE TABLE learner_activity_days (
  user_id TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  completed_lessons INTEGER NOT NULL DEFAULT 0 CHECK (completed_lessons >= 0),
  first_activity_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  saved_answers INTEGER NOT NULL DEFAULT 0 CHECK (saved_answers >= 0),
  PRIMARY KEY (user_id, activity_date)
);

CREATE TABLE learner_course_progress (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  curriculum_version_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE learner_lesson_progress (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  curriculum_version_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  current_step_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, curriculum_version_id, lesson_id),
  CONSTRAINT learner_lesson_progress_course_progress_fk
    FOREIGN KEY (user_id, course_id, curriculum_version_id)
    REFERENCES learner_course_progress(user_id, course_id, curriculum_version_id)
    ON DELETE CASCADE
);

CREATE TABLE learner_lesson_answers (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  curriculum_version_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  answer_json TEXT NOT NULL,
  answered_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, curriculum_version_id, step_id),
  CONSTRAINT learner_lesson_answers_course_progress_fk
    FOREIGN KEY (user_id, course_id, curriculum_version_id)
    REFERENCES learner_course_progress(user_id, course_id, curriculum_version_id)
    ON DELETE CASCADE
);
`

const createLearningIndexesSql = `
CREATE UNIQUE INDEX IF NOT EXISTS learner_course_progress_version_scope_idx
ON learner_course_progress(user_id, course_id, curriculum_version_id);

CREATE INDEX IF NOT EXISTS learner_course_progress_activity_idx
ON learner_course_progress(user_id, last_activity_at, course_id);

CREATE INDEX IF NOT EXISTS learner_lesson_progress_user_course_idx
ON learner_lesson_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS learner_lesson_answers_lesson_idx
ON learner_lesson_answers(user_id, curriculum_version_id, lesson_id);
`

export function runLearningSchemaMigration(sqlite: Database): void {
  if (!learningTables.every((table) => hasTable(sqlite, table))) return

  assertLearningMigrationPrerequisites(sqlite)
  if (!hasCrossModuleForeignKey(sqlite)) {
    sqlite.exec(createLearningIndexesSql)
    return
  }

  sqlite.exec("PRAGMA foreign_keys = OFF")
  sqlite.exec("BEGIN IMMEDIATE")
  try {
    sqlite.exec(`
ALTER TABLE learner_lesson_answers RENAME TO learner_lesson_answers_legacy_p7;
ALTER TABLE learner_lesson_progress RENAME TO learner_lesson_progress_legacy_p7;
ALTER TABLE learner_course_progress RENAME TO learner_course_progress_legacy_p7;
ALTER TABLE learner_activity_days RENAME TO learner_activity_days_legacy_p7;

${createLearningTablesSql}

INSERT INTO learner_activity_days (
  user_id, activity_date, completed_lessons, first_activity_at,
  last_activity_at, saved_answers
)
SELECT
  user_id, activity_date, completed_lessons, first_activity_at,
  last_activity_at, saved_answers
FROM learner_activity_days_legacy_p7;

INSERT INTO learner_course_progress (
  user_id, course_id, curriculum_version_id, status, started_at,
  last_activity_at, completed_at, updated_at
)
SELECT
  user_id, course_id, curriculum_version_id, status, started_at,
  last_activity_at, completed_at, updated_at
FROM learner_course_progress_legacy_p7;

INSERT INTO learner_lesson_progress (
  user_id, course_id, curriculum_version_id, lesson_id, current_step_id,
  status, started_at, completed_at, updated_at
)
SELECT
  user_id, course_id, curriculum_version_id, lesson_id, current_step_id,
  status, started_at, completed_at, updated_at
FROM learner_lesson_progress_legacy_p7;

INSERT INTO learner_lesson_answers (
  user_id, course_id, curriculum_version_id, lesson_id, step_id,
  answer_json, answered_at, updated_at
)
SELECT
  user_id, course_id, curriculum_version_id, lesson_id, step_id,
  answer_json, answered_at, updated_at
FROM learner_lesson_answers_legacy_p7;

DROP TABLE learner_lesson_answers_legacy_p7;
DROP TABLE learner_lesson_progress_legacy_p7;
DROP TABLE learner_course_progress_legacy_p7;
DROP TABLE learner_activity_days_legacy_p7;

${createLearningIndexesSql}
`)
    const violation = sqlite
      .query<unknown, []>("PRAGMA foreign_key_check")
      .get()
    if (violation !== null) {
      throw new Error(
        "learning migration prerequisite failed: foreign key violation"
      )
    }
    sqlite.exec("COMMIT")
  } catch (error) {
    sqlite.exec("ROLLBACK")
    throw error
  } finally {
    sqlite.exec("PRAGMA foreign_keys = ON")
  }
}

export function assertLearningMigrationPrerequisites(sqlite: Database): void {
  if (!learningTables.every((table) => hasTable(sqlite, table))) return

  const invalidReference = sqlite
    .query<{ readonly source: string }, []>(`
      SELECT 'course-progress' AS source
      FROM learner_course_progress
      WHERE user_id = '' OR course_id = '' OR curriculum_version_id = ''
      UNION ALL
      SELECT 'lesson-progress' AS source
      FROM learner_lesson_progress
      WHERE user_id = '' OR course_id = '' OR curriculum_version_id = ''
        OR lesson_id = '' OR current_step_id = ''
      UNION ALL
      SELECT 'lesson-answer' AS source
      FROM learner_lesson_answers
      WHERE user_id = '' OR course_id = '' OR curriculum_version_id = ''
        OR lesson_id = '' OR step_id = ''
      LIMIT 1
    `)
    .get()
  if (invalidReference !== null) {
    throw new Error(
      `learning migration prerequisite failed: invalid ${invalidReference.source} reference`
    )
  }

  const missingCourseProgress = sqlite
    .query<{ readonly lessonId: string }, []>(`
      SELECT progress.lesson_id AS lessonId
      FROM learner_lesson_progress progress
      LEFT JOIN learner_course_progress course_progress
        ON course_progress.user_id = progress.user_id
        AND course_progress.course_id = progress.course_id
        AND course_progress.curriculum_version_id = progress.curriculum_version_id
      WHERE course_progress.user_id IS NULL
      LIMIT 1
    `)
    .get()
  if (missingCourseProgress !== null) {
    throw new Error(
      `learning migration prerequisite failed: lesson without course ${missingCourseProgress.lessonId}`
    )
  }
}

function hasCrossModuleForeignKey(sqlite: Database): boolean {
  return learningTables.some((table) =>
    sqlite
      .query<{ readonly table: string }, []>(
        `PRAGMA foreign_key_list(${table})`
      )
      .all()
      .some((foreignKey) => foreignKey.table === "user")
  )
}

function hasTable(sqlite: Database, tableName: string): boolean {
  return (
    sqlite
      .query<{ readonly value: number }, [string]>(
        "SELECT 1 AS value FROM sqlite_master WHERE type = 'table' AND name = ?"
      )
      .get(tableName) !== null
  )
}
