import type { Database } from "bun:sqlite"
import { z } from "zod"

import {
  lessonStepDtoSchema,
  validateAiFeedbackTargets,
  type LessonStepDto,
} from "@workspace/contracts/content/course"

export type NormalizeVersionedStepContent = (
  stepId: string,
  stepType: string,
  contentJson: string,
  context: Readonly<{
    lessonSteps: readonly Readonly<{
      id: string
      sortOrder: number
      type: string
    }>[]
  }>
) => string

type LegacyCourseRow = {
  readonly id: string
  readonly sortOrder: number
  readonly status: string
}

type LegacyUnitRow = {
  readonly courseId: string
  readonly id: string
  readonly sortOrder: number
  readonly status: string
}

type LegacyLessonRow = {
  readonly courseId: string
  readonly id: string
  readonly sortOrder: number
  readonly status: string
  readonly unitId: string
}

type LegacyStepRow = {
  readonly contentJson: string
  readonly id: string
  readonly lessonId: string
  readonly sortOrder: number
  readonly status: string
  readonly type: string
}

type LegacyProgressRow = {
  readonly currentStepIndex: number
  readonly lessonId: string
  readonly userId: string
}

type LegacyAnswerRow = {
  readonly lessonId: string
  readonly stepId: string
  readonly userId: string
}

type LegacyAttemptRow = {
  readonly lessonId: string
  readonly stepId: string
  readonly userId: string
}

const lessonStepsSchema = z
  .array(lessonStepDtoSchema)
  .superRefine((steps, context) => validateAiFeedbackTargets(steps, context))

const legacyCurriculumRequiredTables = Object.freeze([
  "ai_feedback_attempts",
  "course_units",
  "courses",
  "learner_lesson_answers",
  "learner_lesson_progress",
  "lesson_steps",
  "lessons",
] as const)

export function hasLegacyCurriculumSchema(sqlite: Database): boolean {
  return readColumnNames(sqlite, "courses").includes("curriculum_revision")
}

export function assertLegacyCurriculumMigrationPrerequisites(
  sqlite: Database,
  normalizeVersionedStepContent: NormalizeVersionedStepContent
): void {
  assertPreMigrationDatabaseIntegrity(sqlite)
  validateLegacyCurriculum(sqlite, normalizeVersionedStepContent)
}

export function migrateLegacyCurriculumSchema(
  sqlite: Database,
  baselineSql: string,
  normalizeVersionedStepContent: NormalizeVersionedStepContent,
  prepareLegacyState?: (sqlite: Database) => void
): void {
  assertPreMigrationDatabaseIntegrity(sqlite)

  sqlite.exec("PRAGMA foreign_keys = OFF")
  try {
    sqlite.exec("BEGIN IMMEDIATE")
    prepareLegacyState?.(sqlite)
    const normalizedStepContent = validateLegacyCurriculum(
      sqlite,
      normalizeVersionedStepContent
    )
    updateLegacyStepContent(sqlite, normalizedStepContent)
    renameLegacyCurriculumTables(sqlite)
    sqlite.exec(baselineSql)
    copyLegacyCurriculum(sqlite)
    dropLegacyCurriculumTables(sqlite)
    assertPostMigrationDatabaseIntegrity(sqlite)
    sqlite.exec("COMMIT")
  } catch (error) {
    rollbackIfActive(sqlite)
    throw new Error(`Curriculum migration failed: ${readErrorMessage(error)}`)
  } finally {
    sqlite.exec("PRAGMA foreign_keys = ON")
  }
}

function validateLegacyCurriculum(
  sqlite: Database,
  normalizeVersionedStepContent: NormalizeVersionedStepContent
): ReadonlyMap<string, string> {
  assertRequiredLegacyTables(sqlite)
  assertRequiredLegacyColumns(sqlite)

  const courses = sqlite
    .query<LegacyCourseRow, []>(`
      SELECT id, sort_order AS sortOrder, status
      FROM courses
      ORDER BY sort_order, id
    `)
    .all()
  const units = sqlite
    .query<LegacyUnitRow, []>(`
      SELECT id, course_id AS courseId, sort_order AS sortOrder, status
      FROM course_units
      ORDER BY course_id, sort_order, id
    `)
    .all()
  const lessons = sqlite
    .query<LegacyLessonRow, []>(`
      SELECT lesson.id, lesson.course_id AS courseId,
             lesson.unit_id AS unitId, lesson.sort_order AS sortOrder,
             lesson.status
      FROM lessons lesson
      ORDER BY lesson.unit_id, lesson.sort_order, lesson.id
    `)
    .all()
  const steps = sqlite
    .query<LegacyStepRow, []>(`
      SELECT step.id, step.lesson_id AS lessonId, step.type,
             step.sort_order AS sortOrder, step.content_json AS contentJson,
             step.status
      FROM lesson_steps step
      ORDER BY step.lesson_id, step.sort_order, step.id
    `)
    .all()

  assertLegacyHierarchyRelationships(courses, units, lessons, steps)
  assertEveryParentHasChildren(
    courses.map(({ id }) => id),
    units.map(({ courseId }) => courseId),
    "course"
  )
  assertEveryParentHasChildren(
    units.map(({ id }) => id),
    lessons.map(({ unitId }) => unitId),
    "unit"
  )
  assertEveryParentHasChildren(
    lessons.map(({ id }) => id),
    steps.map(({ lessonId }) => lessonId),
    "lesson"
  )
  assertActivePathsHaveActiveChildren(courses, units, lessons, steps)
  assertContiguousSortOrders(courses, () => "course catalog", "course")
  assertContiguousSortOrders(units, (row) => row.courseId, "course unit")
  assertContiguousSortOrders(lessons, (row) => row.unitId, "lesson")
  assertContiguousSortOrders(steps, (row) => row.lessonId, "lesson step")

  const normalizedStepContent = normalizeAndValidateSteps(
    steps,
    normalizeVersionedStepContent
  )
  validateLegacyProgress(sqlite, lessons, steps)
  validateLegacyAnswers(sqlite, lessons, steps)
  validateLegacyAttempts(sqlite, lessons, steps)

  return normalizedStepContent
}

function normalizeAndValidateSteps(
  steps: readonly LegacyStepRow[],
  normalizeVersionedStepContent: NormalizeVersionedStepContent
): ReadonlyMap<string, string> {
  const normalized = new Map<string, string>()
  const stepsByLessonId = new Map<string, LessonStepDto[]>()
  const legacyStepsByLessonId = groupBy(steps, (step) => step.lessonId)

  for (const step of steps) {
    try {
      const contentJson = normalizeVersionedStepContent(
        step.id,
        step.type,
        step.contentJson,
        {
          lessonSteps: legacyStepsByLessonId.get(step.lessonId) ?? [],
        }
      )
      const parsedContent: unknown = JSON.parse(contentJson)
      if (!isJsonObject(parsedContent)) {
        throw new Error("content must be an object")
      }
      const { type: _storedType, ...content } = parsedContent
      const parsedStep = lessonStepDtoSchema.parse({
        ...content,
        id: step.id,
        sortOrder: step.sortOrder,
        type: step.type,
      })
      const lessonSteps = stepsByLessonId.get(step.lessonId) ?? []
      lessonSteps.push(parsedStep)
      stepsByLessonId.set(step.lessonId, lessonSteps)
      normalized.set(step.id, contentJson)
    } catch (error) {
      throw new Error(
        `step ${step.id} content contract is invalid: ${readErrorMessage(error)}`
      )
    }
  }

  for (const [lessonId, lessonSteps] of stepsByLessonId) {
    const result = lessonStepsSchema.safeParse(lessonSteps)
    if (!result.success) {
      throw new Error(`lesson ${lessonId} step contract is invalid`)
    }
  }

  return normalized
}

function validateLegacyProgress(
  sqlite: Database,
  lessons: readonly LegacyLessonRow[],
  steps: readonly LegacyStepRow[]
): void {
  const lessonIds = new Set(lessons.map(({ id }) => id))
  const stepCountByLessonId = countBy(steps, (step) => step.lessonId)
  const progressRows = sqlite
    .query<LegacyProgressRow, []>(`
      SELECT user_id AS userId, lesson_id AS lessonId,
             current_step_index AS currentStepIndex
      FROM learner_lesson_progress
    `)
    .all()

  for (const progress of progressRows) {
    const stepCount = stepCountByLessonId.get(progress.lessonId) ?? 0
    if (!lessonIds.has(progress.lessonId)) {
      throw new Error(
        `progress lesson ${progress.lessonId} for learner ${progress.userId} is not active`
      )
    }
    if (
      !Number.isInteger(progress.currentStepIndex) ||
      progress.currentStepIndex < 0 ||
      progress.currentStepIndex >= stepCount
    ) {
      throw new Error(
        `progress lesson ${progress.lessonId} has out-of-range currentStepIndex`
      )
    }
  }
}

function validateLegacyAnswers(
  sqlite: Database,
  lessons: readonly LegacyLessonRow[],
  steps: readonly LegacyStepRow[]
): void {
  const lessonIds = new Set(lessons.map(({ id }) => id))
  const stepLessonById = new Map(steps.map((step) => [step.id, step.lessonId]))
  const answers = sqlite
    .query<LegacyAnswerRow, []>(`
      SELECT user_id AS userId, lesson_id AS lessonId, step_id AS stepId
      FROM learner_lesson_answers
    `)
    .all()

  for (const answer of answers) {
    if (
      !lessonIds.has(answer.lessonId) ||
      stepLessonById.get(answer.stepId) !== answer.lessonId
    ) {
      throw new Error(
        `answer step ${answer.stepId} does not belong to lesson ${answer.lessonId}`
      )
    }
  }
}

function validateLegacyAttempts(
  sqlite: Database,
  lessons: readonly LegacyLessonRow[],
  steps: readonly LegacyStepRow[]
): void {
  const lessonIds = new Set(lessons.map(({ id }) => id))
  const stepById = new Map(steps.map((step) => [step.id, step]))
  const attempts = sqlite
    .query<LegacyAttemptRow, []>(`
      SELECT user_id AS userId, lesson_id AS lessonId, step_id AS stepId
      FROM ai_feedback_attempts
    `)
    .all()

  for (const attempt of attempts) {
    const step = stepById.get(attempt.stepId)
    if (
      !lessonIds.has(attempt.lessonId) ||
      step?.lessonId !== attempt.lessonId ||
      step.type !== "AI_FEEDBACK"
    ) {
      throw new Error(
        `AI feedback step ${attempt.stepId} is invalid for lesson ${attempt.lessonId}`
      )
    }
  }
}

function updateLegacyStepContent(
  sqlite: Database,
  normalizedStepContent: ReadonlyMap<string, string>
): void {
  const statement = sqlite.query<never, [string, string]>(
    "UPDATE lesson_steps SET content_json = ? WHERE id = ?"
  )
  for (const [stepId, contentJson] of normalizedStepContent) {
    statement.run(contentJson, stepId)
  }
}

function renameLegacyCurriculumTables(sqlite: Database): void {
  sqlite.exec(`
ALTER TABLE ai_feedback_attempts RENAME TO ai_feedback_attempts_legacy;
ALTER TABLE learner_lesson_answers RENAME TO learner_lesson_answers_legacy;
ALTER TABLE learner_lesson_progress RENAME TO learner_lesson_progress_legacy;
ALTER TABLE lesson_steps RENAME TO lesson_steps_legacy;
ALTER TABLE lessons RENAME TO lessons_legacy;
ALTER TABLE course_units RENAME TO course_units_legacy;
ALTER TABLE courses RENAME TO courses_legacy;
`)
}

function copyLegacyCurriculum(sqlite: Database): void {
  sqlite.exec(`
INSERT INTO courses (id, status, sort_order, published_curriculum_version_id, created_at)
SELECT id, status, sort_order, NULL, 0
FROM courses_legacy;

INSERT INTO course_curriculum_versions (
  id, course_id, revision, edit_version, status,
  title, description, category, visual_key,
  created_at, updated_at, published_at
)
SELECT
  'curriculum:' || id || ':1', id, 1, 0, 'draft',
  title, description, category, visual_key,
  0, 0, NULL
FROM courses_legacy;

INSERT INTO course_unit_versions (
  curriculum_version_id, id, title, sort_order, status
)
SELECT
  'curriculum:' || unit.course_id || ':1',
  unit.id, unit.title, unit.sort_order, unit.status
FROM course_units_legacy unit;

INSERT INTO lesson_versions (
  curriculum_version_id, id, unit_id, title, category, description,
  estimated_minutes, summary_json, sort_order, status
)
SELECT
  'curriculum:' || lesson.course_id || ':1',
  lesson.id, lesson.unit_id, lesson.title, lesson.category, lesson.description,
  lesson.estimated_minutes, lesson.summary_json, lesson.sort_order, lesson.status
FROM lessons_legacy lesson;

INSERT INTO lesson_step_versions (
  curriculum_version_id, id, lesson_id, type, sort_order, content_json, status
)
SELECT
  'curriculum:' || lesson.course_id || ':1',
  step.id, step.lesson_id, step.type, step.sort_order, step.content_json, step.status
FROM lesson_steps_legacy step
JOIN lessons_legacy lesson ON lesson.id = step.lesson_id;

UPDATE course_curriculum_versions
SET status = 'published', published_at = 0
WHERE revision = 1;

UPDATE courses
SET published_curriculum_version_id = 'curriculum:' || id || ':1';

INSERT INTO course_curriculum_versions (
  id, course_id, revision, edit_version, status,
  title, description, category, visual_key,
  created_at, updated_at, published_at
)
SELECT
  'curriculum:' || id || ':2', id, 2, 0, 'draft',
  title, description, category, visual_key,
  0, 0, NULL
FROM courses_legacy;

INSERT INTO course_unit_versions (
  curriculum_version_id, id, title, sort_order, status
)
SELECT
  'curriculum:' || version.course_id || ':2',
  unit.id, unit.title, unit.sort_order, unit.status
FROM course_unit_versions unit
JOIN course_curriculum_versions version
  ON version.id = unit.curriculum_version_id
WHERE version.revision = 1;

INSERT INTO lesson_versions (
  curriculum_version_id, id, unit_id, title, category, description,
  estimated_minutes, summary_json, sort_order, status
)
SELECT
  'curriculum:' || version.course_id || ':2',
  lesson.id, lesson.unit_id, lesson.title, lesson.category, lesson.description,
  lesson.estimated_minutes, lesson.summary_json, lesson.sort_order, lesson.status
FROM lesson_versions lesson
JOIN course_curriculum_versions version
  ON version.id = lesson.curriculum_version_id
WHERE version.revision = 1;

INSERT INTO lesson_step_versions (
  curriculum_version_id, id, lesson_id, type, sort_order, content_json, status
)
SELECT
  'curriculum:' || version.course_id || ':2',
  step.id, step.lesson_id, step.type, step.sort_order, step.content_json, step.status
FROM lesson_step_versions step
JOIN course_curriculum_versions version
  ON version.id = step.curriculum_version_id
WHERE version.revision = 1;

INSERT INTO learner_course_progress (
  user_id, course_id, curriculum_version_id, status,
  started_at, completed_at, last_activity_at, updated_at
)
SELECT
  progress.user_id,
  lesson.course_id,
  'curriculum:' || lesson.course_id || ':1',
  CASE WHEN EXISTS (
    SELECT 1
    FROM lessons_legacy required_lesson
    JOIN course_units_legacy required_unit
      ON required_unit.id = required_lesson.unit_id
    WHERE required_lesson.course_id = lesson.course_id
      AND required_lesson.status = 'active'
      AND required_unit.status = 'active'
  ) AND NOT EXISTS (
    SELECT 1
    FROM lessons_legacy required_lesson
    JOIN course_units_legacy required_unit
      ON required_unit.id = required_lesson.unit_id
    WHERE required_lesson.course_id = lesson.course_id
      AND required_lesson.status = 'active'
      AND required_unit.status = 'active'
      AND NOT EXISTS (
        SELECT 1
        FROM learner_lesson_progress_legacy completed_progress
        WHERE completed_progress.user_id = progress.user_id
          AND completed_progress.lesson_id = required_lesson.id
          AND completed_progress.status = 'completed'
      )
  ) THEN 'completed' ELSE 'in_progress' END,
  MIN(progress.started_at),
  CASE WHEN EXISTS (
    SELECT 1
    FROM lessons_legacy required_lesson
    JOIN course_units_legacy required_unit
      ON required_unit.id = required_lesson.unit_id
    WHERE required_lesson.course_id = lesson.course_id
      AND required_lesson.status = 'active'
      AND required_unit.status = 'active'
  ) AND NOT EXISTS (
    SELECT 1
    FROM lessons_legacy required_lesson
    JOIN course_units_legacy required_unit
      ON required_unit.id = required_lesson.unit_id
    WHERE required_lesson.course_id = lesson.course_id
      AND required_lesson.status = 'active'
      AND required_unit.status = 'active'
      AND NOT EXISTS (
        SELECT 1
        FROM learner_lesson_progress_legacy completed_progress
        WHERE completed_progress.user_id = progress.user_id
          AND completed_progress.lesson_id = required_lesson.id
          AND completed_progress.status = 'completed'
      )
  ) THEN MAX(COALESCE(progress.completed_at, progress.updated_at)) ELSE NULL END,
  MAX(progress.updated_at),
  MAX(progress.updated_at)
FROM learner_lesson_progress_legacy progress
JOIN lessons_legacy lesson ON lesson.id = progress.lesson_id
GROUP BY progress.user_id, lesson.course_id;

INSERT INTO learner_course_progress (
  user_id, course_id, curriculum_version_id, status,
  started_at, completed_at, last_activity_at, updated_at
)
SELECT
  activity.user_id,
  activity.course_id,
  'curriculum:' || activity.course_id || ':1',
  'in_progress',
  MIN(activity.started_at),
  NULL,
  MAX(activity.updated_at),
  MAX(activity.updated_at)
FROM (
  SELECT
    answer.user_id,
    lesson.course_id,
    answer.answered_at AS started_at,
    answer.updated_at
  FROM learner_lesson_answers_legacy answer
  JOIN lessons_legacy lesson ON lesson.id = answer.lesson_id
  UNION ALL
  SELECT
    attempt.user_id,
    lesson.course_id,
    attempt.created_at AS started_at,
    attempt.updated_at
  FROM ai_feedback_attempts_legacy attempt
  JOIN lessons_legacy lesson ON lesson.id = attempt.lesson_id
) activity
WHERE NOT EXISTS (
  SELECT 1
  FROM learner_course_progress existing
  WHERE existing.user_id = activity.user_id
    AND existing.course_id = activity.course_id
)
GROUP BY activity.user_id, activity.course_id;

INSERT INTO learner_lesson_progress (
  user_id, course_id, curriculum_version_id, lesson_id, current_step_id,
  status, started_at, completed_at, updated_at
)
SELECT
  progress.user_id,
  lesson.course_id,
  'curriculum:' || lesson.course_id || ':1',
  progress.lesson_id,
  step.id,
  progress.status,
  progress.started_at,
  progress.completed_at,
  progress.updated_at
FROM learner_lesson_progress_legacy progress
JOIN lessons_legacy lesson ON lesson.id = progress.lesson_id
JOIN lesson_step_versions step
  ON step.curriculum_version_id = 'curriculum:' || lesson.course_id || ':1'
  AND step.lesson_id = progress.lesson_id
  AND step.sort_order = progress.current_step_index + 1;

INSERT INTO learner_lesson_answers (
  user_id, course_id, curriculum_version_id, lesson_id, step_id,
  answer_json, answered_at, updated_at
)
SELECT
  answer.user_id,
  lesson.course_id,
  'curriculum:' || lesson.course_id || ':1',
  answer.lesson_id,
  answer.step_id,
  answer.answer_json,
  answer.answered_at,
  answer.updated_at
FROM learner_lesson_answers_legacy answer
JOIN lessons_legacy lesson ON lesson.id = answer.lesson_id;

INSERT INTO ai_feedback_attempts (
  id, user_id, course_id, curriculum_version_id, lesson_id, step_id,
  attempt_number, idempotency_key, status, answer_text, result_json,
  created_at, updated_at, expires_at
)
SELECT
  attempt.id,
  attempt.user_id,
  lesson.course_id,
  'curriculum:' || lesson.course_id || ':1',
  attempt.lesson_id,
  attempt.step_id,
  attempt.attempt_number,
  attempt.idempotency_key,
  attempt.status,
  attempt.answer_text,
  attempt.result_json,
  attempt.created_at,
  attempt.updated_at,
  attempt.expires_at
FROM ai_feedback_attempts_legacy attempt
JOIN lessons_legacy lesson ON lesson.id = attempt.lesson_id;
`)
}

function dropLegacyCurriculumTables(sqlite: Database): void {
  sqlite.exec(`
DROP TABLE ai_feedback_attempts_legacy;
DROP TABLE learner_lesson_answers_legacy;
DROP TABLE learner_lesson_progress_legacy;
DROP TABLE lesson_steps_legacy;
DROP TABLE lessons_legacy;
DROP TABLE course_units_legacy;
DROP TABLE courses_legacy;
`)
}

function assertRequiredLegacyTables(sqlite: Database): void {
  const tables = new Set(
    sqlite
      .query<{ readonly name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table'"
      )
      .all()
      .map(({ name }) => name)
  )
  const missing = legacyCurriculumRequiredTables.filter(
    (table) => !tables.has(table)
  )
  if (missing.length > 0) {
    throw new Error(
      `legacy curriculum tables are missing: ${missing.join(", ")}`
    )
  }
}

function assertRequiredLegacyColumns(sqlite: Database): void {
  const requiredColumns = {
    course_units: ["id", "course_id", "title", "sort_order", "status"],
    courses: [
      "id",
      "title",
      "description",
      "category",
      "visual_key",
      "status",
      "sort_order",
      "curriculum_revision",
    ],
    learner_lesson_answers: [
      "user_id",
      "lesson_id",
      "step_id",
      "answer_json",
      "answered_at",
      "updated_at",
    ],
    learner_lesson_progress: [
      "user_id",
      "lesson_id",
      "current_step_index",
      "status",
      "started_at",
      "completed_at",
      "updated_at",
    ],
    lesson_steps: [
      "id",
      "lesson_id",
      "type",
      "sort_order",
      "content_json",
      "status",
    ],
    lessons: [
      "id",
      "course_id",
      "unit_id",
      "title",
      "category",
      "description",
      "estimated_minutes",
      "summary_json",
      "sort_order",
      "status",
    ],
  } as const

  for (const [tableName, columns] of Object.entries(requiredColumns)) {
    assertRequiredColumns(sqlite, tableName, columns)
  }

  const attemptColumns = readColumnNames(sqlite, "ai_feedback_attempts")
  assertRequiredColumns(
    sqlite,
    "ai_feedback_attempts",
    attemptColumns.includes("status")
      ? [
          "id",
          "user_id",
          "lesson_id",
          "step_id",
          "attempt_number",
          "idempotency_key",
          "status",
          "answer_text",
          "result_json",
          "created_at",
          "updated_at",
          "expires_at",
        ]
      : [
          "user_id",
          "lesson_id",
          "step_id",
          "attempt_number",
          "answer_text",
          "result_json",
          "created_at",
        ]
  )
}

function assertRequiredColumns(
  sqlite: Database,
  tableName: string,
  requiredColumns: readonly string[]
): void {
  const columns = readColumnNames(sqlite, tableName)
  const missing = requiredColumns.filter((column) => !columns.includes(column))
  if (missing.length > 0) {
    throw new Error(
      `legacy curriculum table ${tableName} is missing columns: ${missing.join(", ")}`
    )
  }
}

function assertLegacyHierarchyRelationships(
  courses: readonly LegacyCourseRow[],
  units: readonly LegacyUnitRow[],
  lessons: readonly LegacyLessonRow[],
  steps: readonly LegacyStepRow[]
): void {
  assertKnownStatuses(courses, "course")
  assertKnownStatuses(units, "course unit")
  assertKnownStatuses(lessons, "lesson")
  assertKnownStatuses(steps, "lesson step")

  const coursesById = new Map(courses.map((course) => [course.id, course]))
  const unitsById = new Map(units.map((unit) => [unit.id, unit]))
  const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]))

  for (const unit of units) {
    if (!coursesById.has(unit.courseId)) {
      throw new Error(
        `course unit ${unit.id} references missing course ${unit.courseId}`
      )
    }
  }

  for (const lesson of lessons) {
    const unit = unitsById.get(lesson.unitId)
    if (unit === undefined) {
      throw new Error(
        `lesson ${lesson.id} references missing course unit ${lesson.unitId}`
      )
    }
    if (unit.courseId !== lesson.courseId) {
      throw new Error(
        `lesson ${lesson.id} course ${lesson.courseId} does not match course unit ${lesson.unitId}`
      )
    }
  }

  for (const step of steps) {
    if (!lessonsById.has(step.lessonId)) {
      throw new Error(
        `lesson step ${step.id} references missing lesson ${step.lessonId}`
      )
    }
  }

  const hierarchyIds = [...units, ...lessons, ...steps].map(({ id }) => id)
  if (new Set(hierarchyIds).size !== hierarchyIds.length) {
    throw new Error("legacy curriculum hierarchy contains duplicate IDs")
  }
}

function assertKnownStatuses(
  rows: readonly { readonly id: string; readonly status: string }[],
  rowKind: string
): void {
  const invalid = rows.find(
    ({ status }) => status !== "active" && status !== "archived"
  )
  if (invalid !== undefined) {
    throw new Error(
      `${rowKind} ${invalid.id} has invalid status ${invalid.status}`
    )
  }
}

function assertActivePathsHaveActiveChildren(
  courses: readonly LegacyCourseRow[],
  units: readonly LegacyUnitRow[],
  lessons: readonly LegacyLessonRow[],
  steps: readonly LegacyStepRow[]
): void {
  const activeCourseIds = new Set(
    courses.filter(({ status }) => status === "active").map(({ id }) => id)
  )
  const activeUnits = units.filter(
    ({ courseId, status }) =>
      status === "active" && activeCourseIds.has(courseId)
  )
  const activeUnitIds = new Set(activeUnits.map(({ id }) => id))
  const activeLessons = lessons.filter(
    ({ status, unitId }) => status === "active" && activeUnitIds.has(unitId)
  )

  assertEveryParentHasActiveChildren(
    [...activeCourseIds],
    activeUnits.map(({ courseId }) => courseId),
    "course"
  )
  assertEveryParentHasActiveChildren(
    [...activeUnitIds],
    activeLessons.map(({ unitId }) => unitId),
    "course unit"
  )
  assertEveryParentHasActiveChildren(
    activeLessons.map(({ id }) => id),
    steps
      .filter(({ status }) => status === "active")
      .map(({ lessonId }) => lessonId),
    "lesson"
  )
}

function assertEveryParentHasChildren(
  parentIds: readonly string[],
  childParentIds: readonly string[],
  parentKind: string
): void {
  const parentIdsWithChildren = new Set(childParentIds)
  const emptyParentId = parentIds.find((id) => !parentIdsWithChildren.has(id))
  if (emptyParentId !== undefined) {
    throw new Error(`${parentKind} ${emptyParentId} has no children`)
  }
}

function assertEveryParentHasActiveChildren(
  parentIds: readonly string[],
  childParentIds: readonly string[],
  parentKind: string
): void {
  const parentIdsWithChildren = new Set(childParentIds)
  const emptyParentId = parentIds.find((id) => !parentIdsWithChildren.has(id))
  if (emptyParentId !== undefined) {
    throw new Error(`${parentKind} ${emptyParentId} has no active children`)
  }
}

function assertContiguousSortOrders<T extends { readonly sortOrder: number }>(
  rows: readonly T[],
  readScope: (row: T) => string,
  rowKind: string
): void {
  const ordersByScope = new Map<string, number[]>()
  for (const row of rows) {
    const scope = readScope(row)
    const orders = ordersByScope.get(scope) ?? []
    orders.push(row.sortOrder)
    ordersByScope.set(scope, orders)
  }

  for (const [scope, orders] of ordersByScope) {
    orders.sort((left, right) => left - right)
    if (orders.some((order, index) => order !== index + 1)) {
      throw new Error(`${rowKind} sortOrder is not contiguous in ${scope}`)
    }
  }
}

function countBy<T>(
  values: readonly T[],
  readKey: (value: T) => string
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) {
    const key = readKey(value)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

function groupBy<T>(
  values: readonly T[],
  readKey: (value: T) => string
): ReadonlyMap<string, readonly T[]> {
  const groups = new Map<string, T[]>()
  for (const value of values) {
    const key = readKey(value)
    const group = groups.get(key) ?? []
    group.push(value)
    groups.set(key, group)
  }
  return groups
}

function assertPreMigrationDatabaseIntegrity(sqlite: Database): void {
  const integrity = sqlite
    .query<{ readonly integrity_check: string }, []>("PRAGMA integrity_check")
    .get()?.integrity_check
  if (integrity !== "ok")
    throw new Error("pre-migration integrity_check failed")
  if (readForeignKeyViolations(sqlite).length > 0) {
    throw new Error("pre-migration foreign_key_check failed")
  }
}

function assertPostMigrationDatabaseIntegrity(sqlite: Database): void {
  const integrity = sqlite
    .query<{ readonly integrity_check: string }, []>("PRAGMA integrity_check")
    .get()?.integrity_check
  if (integrity !== "ok")
    throw new Error("post-migration integrity_check failed")
  const foreignKeyViolations = readForeignKeyViolations(sqlite)
  if (foreignKeyViolations.length > 0) {
    throw new Error("post-migration foreign_key_check failed")
  }
}

function readForeignKeyViolations(
  sqlite: Database
): readonly { readonly table: string }[] {
  return sqlite
    .query<{ readonly table: string }, []>("PRAGMA foreign_key_check")
    .all()
}

function readColumnNames(
  sqlite: Database,
  tableName: string
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
    .all()
    .map(({ name }) => name)
}

function rollbackIfActive(sqlite: Database): void {
  try {
    sqlite.exec("ROLLBACK")
  } catch {
    // transaction이 시작되기 전 실패한 경우 rollback할 상태가 없다.
  }
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown migration error"
}

function isJsonObject(value: unknown): value is { [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
