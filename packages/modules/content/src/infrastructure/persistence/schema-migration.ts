import type { Database } from "bun:sqlite"

const crossModuleReferenceChecks = [
  {
    description: "learner course",
    query: `
      SELECT 1
      FROM learner_course_progress progress
      LEFT JOIN courses course ON course.id = progress.course_id
      LEFT JOIN course_curriculum_versions version
        ON version.id = progress.curriculum_version_id
        AND version.course_id = progress.course_id
      WHERE course.id IS NULL OR version.id IS NULL
      LIMIT 1
    `,
  },
  {
    description: "learner lesson",
    query: `
      SELECT 1
      FROM learner_lesson_progress progress
      LEFT JOIN lesson_versions lesson
        ON lesson.curriculum_version_id = progress.curriculum_version_id
        AND lesson.id = progress.lesson_id
      LEFT JOIN lesson_step_versions step
        ON step.curriculum_version_id = progress.curriculum_version_id
        AND step.lesson_id = progress.lesson_id
        AND step.id = progress.current_step_id
      WHERE lesson.id IS NULL OR step.id IS NULL
      LIMIT 1
    `,
  },
  {
    description: "learner answer",
    query: `
      SELECT 1
      FROM learner_lesson_answers answer
      LEFT JOIN lesson_step_versions step
        ON step.curriculum_version_id = answer.curriculum_version_id
        AND step.lesson_id = answer.lesson_id
        AND step.id = answer.step_id
      WHERE step.id IS NULL
      LIMIT 1
    `,
  },
  {
    description: "AI feedback attempt",
    query: `
      SELECT 1
      FROM ai_feedback_attempts attempt
      LEFT JOIN lesson_step_versions step
        ON step.curriculum_version_id = attempt.curriculum_version_id
        AND step.lesson_id = attempt.lesson_id
        AND step.id = attempt.step_id
      WHERE step.id IS NULL
      LIMIT 1
    `,
  },
] as const

const createContentTriggersSql = `
CREATE TRIGGER IF NOT EXISTS course_unit_versions_published_insert_guard
BEFORE INSERT ON course_unit_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS course_unit_versions_published_update_guard
BEFORE UPDATE ON course_unit_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id IN (OLD.curriculum_version_id, NEW.curriculum_version_id)
    AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS course_unit_versions_published_delete_guard
BEFORE DELETE ON course_unit_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_versions_published_insert_guard
BEFORE INSERT ON lesson_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_versions_published_update_guard
BEFORE UPDATE ON lesson_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id IN (OLD.curriculum_version_id, NEW.curriculum_version_id)
    AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_versions_published_delete_guard
BEFORE DELETE ON lesson_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_step_versions_published_insert_guard
BEFORE INSERT ON lesson_step_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_step_versions_published_update_guard
BEFORE UPDATE ON lesson_step_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id IN (OLD.curriculum_version_id, NEW.curriculum_version_id)
    AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_step_versions_published_delete_guard
BEFORE DELETE ON lesson_step_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS courses_published_version_insert_check
BEFORE INSERT ON courses
WHEN NEW.published_curriculum_version_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
    FROM course_curriculum_versions version
    WHERE version.id = NEW.published_curriculum_version_id
      AND version.course_id = NEW.id
      AND version.status = 'published'
  ) THEN RAISE(ABORT, 'published curriculum version must belong to the course and be published') END;
END;

CREATE TRIGGER IF NOT EXISTS courses_published_version_update_check
BEFORE UPDATE OF published_curriculum_version_id ON courses
WHEN NEW.published_curriculum_version_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
    FROM course_curriculum_versions version
    WHERE version.id = NEW.published_curriculum_version_id
      AND version.course_id = NEW.id
      AND version.status = 'published'
  ) THEN RAISE(ABORT, 'published curriculum version must belong to the course and be published') END;
END;

CREATE TRIGGER IF NOT EXISTS course_curriculum_versions_published_update_guard
BEFORE UPDATE ON course_curriculum_versions
WHEN OLD.status = 'published'
BEGIN
  SELECT RAISE(ABORT, 'published curriculum version is immutable');
END;

CREATE TRIGGER IF NOT EXISTS course_curriculum_versions_published_delete_guard
BEFORE DELETE ON course_curriculum_versions
WHEN OLD.status = 'published'
BEGIN
  SELECT RAISE(ABORT, 'published curriculum version is immutable');
END;
`

export function runContentSchemaMigration(sqlite: Database): void {
  if (!hasContentTables(sqlite)) return

  assertContentMigrationPrerequisites(sqlite)
  sqlite.exec(createContentTriggersSql)
}

export function assertContentMigrationPrerequisites(sqlite: Database): void {
  if (!hasContentTables(sqlite)) return

  const duplicateDraft = sqlite
    .query<{ readonly courseId: string }, []>(`
      SELECT course_id AS courseId
      FROM course_curriculum_versions
      WHERE status = 'draft'
      GROUP BY course_id
      HAVING COUNT(*) > 1
      LIMIT 1
    `)
    .get()
  if (duplicateDraft !== null) {
    throw new Error(
      `content migration prerequisite failed: multiple drafts for ${duplicateDraft.courseId}`
    )
  }

  for (const check of crossModuleReferenceChecks) {
    if (!hasRequiredTables(sqlite, check.query)) continue
    const orphan = sqlite
      .query<{ readonly value: number }, []>(check.query)
      .get()
    if (orphan !== null) {
      throw new Error(
        `content migration prerequisite failed: orphan ${check.description} reference`
      )
    }
  }
}

function hasContentTables(sqlite: Database): boolean {
  return readTableNames(sqlite).has("course_curriculum_versions")
}

function hasRequiredTables(sqlite: Database, query: string): boolean {
  const tables = readTableNames(sqlite)
  const referencedTables = [
    "ai_feedback_attempts",
    "learner_course_progress",
    "learner_lesson_answers",
    "learner_lesson_progress",
  ].filter((table) => query.includes(table))
  return referencedTables.every((table) => tables.has(table))
}

function readTableNames(sqlite: Database): ReadonlySet<string> {
  return new Set(
    sqlite
      .query<{ readonly name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table'"
      )
      .all()
      .map(({ name }) => name)
  )
}
