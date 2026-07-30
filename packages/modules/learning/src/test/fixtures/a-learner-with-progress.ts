import type { PublishedCourseFixture } from "@workspace/content/test-fixtures"
import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

export type LearnerProgressFixtureInput = Readonly<{
  activityDates?: readonly string[]
  completedAt?: number | null
  course: PublishedCourseFixture
  lessonId?: string
  startedAt?: number
  status?: "completed" | "in_progress"
  stepId?: string
  userId: string
}>

export function aLearnerWithProgress(
  sqlite: WritingAppSqlite,
  input: LearnerProgressFixtureInput
): void {
  const {
    activityDates = ["2026-07-01"],
    completedAt = null,
    course,
    lessonId = course.lessonId,
    startedAt = 1,
    status = "in_progress",
    stepId = course.stepId,
    userId,
  } = input
  const lastActivityAt = completedAt ?? startedAt

  sqlite
    .query<void, [string, string, string, number, number]>(
      `INSERT INTO learner_course_progress (
        user_id, course_id, curriculum_version_id, status, started_at,
        completed_at, last_activity_at, updated_at
      ) VALUES (?1, ?2, ?3, 'in_progress', ?4, NULL, ?5, ?5)`
    )
    .run(
      userId,
      course.courseId,
      course.curriculumVersionId,
      startedAt,
      lastActivityAt
    )

  sqlite
    .query<
      void,
      [
        string,
        string,
        string,
        string,
        string,
        "completed" | "in_progress",
        number,
        number | null,
        number,
      ]
    >(
      `INSERT INTO learner_lesson_progress (
        user_id, course_id, curriculum_version_id, lesson_id, current_step_id,
        status, started_at, completed_at, updated_at
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9
      )`
    )
    .run(
      userId,
      course.courseId,
      course.curriculumVersionId,
      lessonId,
      stepId,
      status,
      startedAt,
      completedAt,
      lastActivityAt
    )

  sqlite
    .query<void, [string, string, string, string, string]>(
      `INSERT INTO learner_lesson_answers (
        user_id, course_id, curriculum_version_id, lesson_id, step_id,
        answer_json, answered_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, '{"text":"answer"}', 1, 1)`
    )
    .run(userId, course.courseId, course.curriculumVersionId, lessonId, stepId)

  sqlite
    .query<void, [string, string, string, string, string]>(
      `INSERT INTO learner_step_drafts (
        user_id, course_id, curriculum_version_id, lesson_id, step_id,
        answer_json, version, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, '{"text":"draft"}', 0, 1)`
    )
    .run(userId, course.courseId, course.curriculumVersionId, lessonId, stepId)

  const activityDay = sqlite.query<void, [string, string, number]>(
    `INSERT INTO learner_activity_days (
      user_id, activity_date, first_activity_at, last_activity_at,
      completed_lessons, saved_answers
    ) VALUES (?1, ?2, ?3, ?3, 0, 1)`
  )
  for (const activityDate of activityDates) {
    activityDay.run(
      userId,
      activityDate,
      Date.parse(`${activityDate}T09:00:00+09:00`)
    )
  }
}
