import type { PublishedCourseFixture } from "@workspace/content/test-fixtures"
import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

export type LearnerProgressFixtureInput = Readonly<{
  answerJson?: string
  course: PublishedCourseFixture
  draftJson?: string
  includeActivityDay?: boolean
  userId: string
}>

export function aLearnerWithProgress(
  sqlite: WritingAppSqlite,
  input: LearnerProgressFixtureInput
): void {
  const {
    answerJson = '{"text":"answer"}',
    course,
    draftJson = '{"text":"draft"}',
    includeActivityDay = true,
    userId,
  } = input

  sqlite
    .query<void, [string, string, string]>(
      `INSERT INTO learner_course_progress (
        user_id, course_id, curriculum_version_id, status, started_at,
        completed_at, last_activity_at, updated_at
      ) VALUES (?1, ?2, ?3, 'in_progress', 1, NULL, 1, 1)`
    )
    .run(userId, course.courseId, course.curriculumVersionId)

  sqlite
    .query<void, [string, string, string, string, string]>(
      `INSERT INTO learner_lesson_progress (
        user_id, course_id, curriculum_version_id, lesson_id, current_step_id,
        status, started_at, completed_at, updated_at
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, 'in_progress', 1, NULL, 1
      )`
    )
    .run(
      userId,
      course.courseId,
      course.curriculumVersionId,
      course.lessonId,
      course.stepId
    )

  sqlite
    .query<void, [string, string, string, string, string, string]>(
      `INSERT INTO learner_lesson_answers (
        user_id, course_id, curriculum_version_id, lesson_id, step_id,
        answer_json, answered_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, 1)`
    )
    .run(
      userId,
      course.courseId,
      course.curriculumVersionId,
      course.lessonId,
      course.stepId,
      answerJson
    )

  sqlite
    .query<void, [string, string, string, string, string, string]>(
      `INSERT INTO learner_step_drafts (
        user_id, course_id, curriculum_version_id, lesson_id, step_id,
        answer_json, version, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, 1)`
    )
    .run(
      userId,
      course.courseId,
      course.curriculumVersionId,
      course.lessonId,
      course.stepId,
      draftJson
    )

  if (includeActivityDay) {
    sqlite
      .query<void, [string]>(
        `INSERT INTO learner_activity_days (
          user_id, activity_date, first_activity_at, last_activity_at,
          completed_lessons, saved_answers
        ) VALUES (?1, '2026-07-01', 1, 1, 0, 1)`
      )
      .run(userId)
  }
}
