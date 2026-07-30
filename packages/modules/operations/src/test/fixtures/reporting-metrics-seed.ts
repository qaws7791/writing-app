import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

export function insertLearner(
  sqlite: WritingAppSqlite,
  input: Readonly<{
    createdAt: string
    id: string
    status: "active" | "deleted"
  }>
): void {
  const createdAt = Date.parse(input.createdAt)
  sqlite
    .query<void, [string, string, string, number]>(`
      INSERT INTO user (
        id, name, email, email_verified, created_at, updated_at
      )
      VALUES (?1, ?2, ?3, 1, ?4, ?4)
    `)
    .run(input.id, input.id, `${input.id}@example.com`, createdAt)
  sqlite
    .query<void, [string, string, number | null]>(`
      INSERT INTO learner_profiles (
        user_id, display_name, status, deleted_at, version
      )
      VALUES (?1, ?1, ?2, ?3, 0)
    `)
    .run(input.id, input.status, input.status === "deleted" ? createdAt : null)
}

export function insertPublishedCourse(sqlite: WritingAppSqlite): void {
  sqlite.exec(`
    INSERT INTO courses (
      created_at, id, published_curriculum_version_id, sort_order, status
    )
    VALUES (1, 'course-1', NULL, 1, 'active');

    INSERT INTO course_curriculum_versions (
      category,
      course_id,
      created_at,
      description,
      edit_version,
      id,
      published_at,
      revision,
      status,
      title,
      updated_at,
      visual_key
    )
    VALUES (
      '기초',
      'course-1',
      1,
      '설명',
      0,
      'curriculum-1',
      NULL,
      1,
      'draft',
      '글쓰기 코스',
      1,
      'basic-sentence-writing'
    );

    INSERT INTO course_unit_versions (
      curriculum_version_id, id, sort_order, status, title
    )
    VALUES ('curriculum-1', 'unit-1', 1, 'active', '기초 유닛');

    INSERT INTO lesson_versions (
      category,
      curriculum_version_id,
      description,
      estimated_minutes,
      id,
      sort_order,
      status,
      summary_json,
      title,
      unit_id
    )
    VALUES
      (
        '기초',
        'curriculum-1',
        '첫 번째',
        5,
        'lesson-1',
        1,
        'active',
        '[]',
        '첫 번째 레슨',
        'unit-1'
      ),
      (
        '기초',
        'curriculum-1',
        '두 번째',
        5,
        'lesson-2',
        2,
        'active',
        '[]',
        '두 번째 레슨',
        'unit-1'
      );

    INSERT INTO lesson_step_versions (
      content_json,
      curriculum_version_id,
      id,
      lesson_id,
      sort_order,
      status,
      type
    )
    VALUES
      ('{}', 'curriculum-1', 'step-1', 'lesson-1', 1, 'active', 'READING'),
      ('{}', 'curriculum-1', 'step-2', 'lesson-2', 1, 'active', 'READING');

    UPDATE course_curriculum_versions
    SET published_at = 2, status = 'published'
    WHERE id = 'curriculum-1';

    UPDATE courses
    SET published_curriculum_version_id = 'curriculum-1'
    WHERE id = 'course-1';
  `)
}

export function insertProgress(
  sqlite: WritingAppSqlite,
  input: Readonly<{
    completedAt: string | null
    startedAt: string
    status: "completed" | "in_progress"
    userId: string
  }>
): void {
  const startedAt = Date.parse(input.startedAt)
  const completedAt =
    input.completedAt === null ? null : Date.parse(input.completedAt)
  const updatedAt = completedAt ?? startedAt
  sqlite
    .query<void, [string, number, number]>(`
      INSERT INTO learner_course_progress (
        user_id,
        course_id,
        curriculum_version_id,
        status,
        started_at,
        completed_at,
        last_activity_at,
        updated_at
      )
      VALUES (
        ?1,
        'course-1',
        'curriculum-1',
        'in_progress',
        ?2,
        NULL,
        ?3,
        ?3
      );
    `)
    .run(input.userId, startedAt, updatedAt)
  sqlite
    .query<
      void,
      [string, "completed" | "in_progress", number, number | null, number]
    >(`
      INSERT INTO learner_lesson_progress (
        user_id,
        course_id,
        curriculum_version_id,
        lesson_id,
        status,
        current_step_id,
        started_at,
        completed_at,
        updated_at
      )
      VALUES (
        ?1,
        'course-1',
        'curriculum-1',
        'lesson-1',
        ?2,
        'step-1',
        ?3,
        ?4,
        ?5
      );
    `)
    .run(input.userId, input.status, startedAt, completedAt, updatedAt)
}

export function insertActivityDays(
  sqlite: WritingAppSqlite,
  userId: string,
  dates: readonly string[]
): void {
  const statement = sqlite.query<void, [string, string, number]>(`
    INSERT INTO learner_activity_days (
      user_id,
      activity_date,
      completed_lessons,
      first_activity_at,
      last_activity_at,
      saved_answers
    )
    VALUES (?1, ?2, 0, ?3, ?3, 1)
  `)
  for (const date of dates) {
    statement.run(userId, date, Date.parse(`${date}T09:00:00+09:00`))
  }
}

export function insertAiFeedbackAttempts(sqlite: WritingAppSqlite): void {
  type Attempt = Readonly<{
    createdAt: string
    failureCode: "provider-timeout" | null
    id: string
    idempotencyKey: string
    lessonId: "lesson-1" | "lesson-2"
    quotaDate: string
    status: "failed" | "succeeded"
    stepId: "step-1" | "step-2"
    userId: string
  }>

  const attempts: readonly Attempt[] = [
    {
      createdAt: "2026-07-20T10:00:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-lesson-1-failed",
      idempotencyKey: "lesson-1-failed",
      lessonId: "lesson-1",
      quotaDate: "2026-07-20",
      status: "failed",
      stepId: "step-1",
      userId: "learner-a",
    },
    {
      createdAt: "2026-07-20T10:01:00+09:00",
      failureCode: null,
      id: "attempt-lesson-1-succeeded",
      idempotencyKey: "lesson-1-succeeded",
      lessonId: "lesson-1",
      quotaDate: "2026-07-20",
      status: "succeeded",
      stepId: "step-1",
      userId: "learner-b",
    },
    {
      createdAt: "2026-07-20T10:02:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-lesson-2-failed",
      idempotencyKey: "lesson-2-failed",
      lessonId: "lesson-2",
      quotaDate: "2026-07-20",
      status: "failed",
      stepId: "step-2",
      userId: "learner-b",
    },
    {
      createdAt: "2026-07-20T10:03:00+09:00",
      failureCode: null,
      id: "attempt-lesson-2-succeeded",
      idempotencyKey: "lesson-2-succeeded",
      lessonId: "lesson-2",
      quotaDate: "2026-07-20",
      status: "succeeded",
      stepId: "step-2",
      userId: "learner-a",
    },
    {
      createdAt: "2026-07-20T10:04:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-deleted-learner",
      idempotencyKey: "deleted-learner",
      lessonId: "lesson-1",
      quotaDate: "2026-07-20",
      status: "failed",
      stepId: "step-1",
      userId: "learner-d",
    },
    {
      createdAt: "2026-06-20T10:00:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-outside-period",
      idempotencyKey: "outside-period",
      lessonId: "lesson-2",
      quotaDate: "2026-06-20",
      status: "failed",
      stepId: "step-2",
      userId: "learner-c",
    },
  ]
  const statement = sqlite.query<
    void,
    [
      string,
      string,
      string,
      string,
      string,
      "failed" | "succeeded",
      "provider-timeout" | null,
      string,
      number,
      string | null,
    ]
  >(`
    INSERT INTO ai_feedback_attempts (
      answer_text,
      attempt_number,
      course_id,
      created_at,
      curriculum_version_id,
      expires_at,
      failure_code,
      id,
      idempotency_key,
      lesson_id,
      model,
      prompt_policy_version,
      quota_date,
      result_json,
      status,
      step_id,
      updated_at,
      user_id
    )
    VALUES (
      '절대 노출하지 않을 답안',
      1,
      'course-1',
      ?9,
      'curriculum-1',
      ?9 + 60000,
      ?7,
      ?1,
      ?5,
      ?3,
      'test-model',
      'policy-v1',
      ?8,
      ?10,
      ?6,
      ?4,
      ?9,
      ?2
    )
  `)

  for (const attempt of attempts) {
    const createdAt = Date.parse(attempt.createdAt)
    statement.run(
      attempt.id,
      attempt.userId,
      attempt.lessonId,
      attempt.stepId,
      attempt.idempotencyKey,
      attempt.status,
      attempt.failureCode,
      attempt.quotaDate,
      createdAt,
      attempt.status === "succeeded" ? "{}" : null
    )
  }
}
