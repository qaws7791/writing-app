import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

export type PublishedCourseSeed = Readonly<{
  courseId: string
  curriculumVersionId: string
  lessonIds: readonly [string, string]
  stepIds: readonly [string, string]
}>

export type AiFeedbackAttemptSeed = Readonly<{
  answerText?: string
  attemptNumber?: number
  course: PublishedCourseSeed
  createdAt: string
  failureCode: AiFeedbackSeedFailureCode | null
  id: string
  idempotencyKey: string
  inputTokenCount?: number | null
  latencyMs?: number | null
  lessonId: string
  outputTokenCount?: number | null
  quotaDate: string
  resultJson?: string | null
  status: "failed" | "succeeded"
  stepId: string
  userId: string
}>

type AiFeedbackSeedFailureCode = "provider-timeout" | "provider-unavailable"

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

export function insertPublishedCourse(
  sqlite: WritingAppSqlite
): PublishedCourseSeed {
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

  return {
    courseId: "course-1",
    curriculumVersionId: "curriculum-1",
    lessonIds: ["lesson-1", "lesson-2"],
    stepIds: ["step-1", "step-2"],
  }
}

export function insertProgress(
  sqlite: WritingAppSqlite,
  input: Readonly<{
    completedAt: string | null
    course: PublishedCourseSeed
    lessonId: string
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
    .query<void, [string, string, string, number, number]>(`
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
      VALUES (?1, ?2, ?3, 'in_progress', ?4, NULL, ?5, ?5);
    `)
    .run(
      input.userId,
      input.course.courseId,
      input.course.curriculumVersionId,
      startedAt,
      updatedAt
    )
  sqlite
    .query<
      void,
      [
        string,
        string,
        string,
        string,
        "completed" | "in_progress",
        string,
        number,
        number | null,
        number,
      ]
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
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9);
    `)
    .run(
      input.userId,
      input.course.courseId,
      input.course.curriculumVersionId,
      input.lessonId,
      input.status,
      input.course.stepIds[0],
      startedAt,
      completedAt,
      updatedAt
    )
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

export function insertAiFeedbackAttempt(
  sqlite: WritingAppSqlite,
  seed: AiFeedbackAttemptSeed
): void {
  const createdAt = Date.parse(seed.createdAt)
  sqlite
    .query<
      void,
      [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        number,
        "failed" | "succeeded",
        AiFeedbackSeedFailureCode | null,
        string,
        number,
        string,
        number | null,
        number | null,
        number | null,
        string | null,
      ]
    >(`
      INSERT INTO ai_feedback_attempts (
        id,
        user_id,
        course_id,
        curriculum_version_id,
        lesson_id,
        step_id,
        answer_text,
        attempt_number,
        status,
        failure_code,
        idempotency_key,
        created_at,
        updated_at,
        expires_at,
        quota_date,
        input_token_count,
        latency_ms,
        output_token_count,
        result_json,
        model,
        prompt_policy_version
      )
      VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?12, ?12 + 60000,
        ?13, ?14, ?15, ?16, ?17, 'test-model', 'policy-v1'
      )
    `)
    .run(
      seed.id,
      seed.userId,
      seed.course.courseId,
      seed.course.curriculumVersionId,
      seed.lessonId,
      seed.stepId,
      seed.answerText ?? "절대 노출하지 않을 답안",
      seed.attemptNumber ?? 1,
      seed.status,
      seed.failureCode,
      seed.idempotencyKey,
      createdAt,
      seed.quotaDate,
      seed.inputTokenCount ?? null,
      seed.latencyMs ?? null,
      seed.outputTokenCount ?? null,
      seed.resultJson ?? null
    )
}

export function insertAiFeedbackAttempts(
  sqlite: WritingAppSqlite,
  course: PublishedCourseSeed
): void {
  const attempts = [
    {
      createdAt: "2026-07-20T10:00:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-lesson-1-failed",
      idempotencyKey: "lesson-1-failed",
      lessonIndex: 0,
      quotaDate: "2026-07-20",
      status: "failed",
      userId: "learner-a",
    },
    {
      createdAt: "2026-07-20T10:01:00+09:00",
      failureCode: null,
      id: "attempt-lesson-1-succeeded",
      idempotencyKey: "lesson-1-succeeded",
      lessonIndex: 0,
      quotaDate: "2026-07-20",
      status: "succeeded",
      userId: "learner-b",
    },
    {
      createdAt: "2026-07-20T10:02:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-lesson-2-failed",
      idempotencyKey: "lesson-2-failed",
      lessonIndex: 1,
      quotaDate: "2026-07-20",
      status: "failed",
      userId: "learner-b",
    },
    {
      createdAt: "2026-07-20T10:03:00+09:00",
      failureCode: null,
      id: "attempt-lesson-2-succeeded",
      idempotencyKey: "lesson-2-succeeded",
      lessonIndex: 1,
      quotaDate: "2026-07-20",
      status: "succeeded",
      userId: "learner-a",
    },
    {
      createdAt: "2026-07-20T10:04:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-deleted-learner",
      idempotencyKey: "deleted-learner",
      lessonIndex: 0,
      quotaDate: "2026-07-20",
      status: "failed",
      userId: "learner-d",
    },
    {
      createdAt: "2026-06-20T10:00:00+09:00",
      failureCode: "provider-timeout",
      id: "attempt-outside-period",
      idempotencyKey: "outside-period",
      lessonIndex: 1,
      quotaDate: "2026-06-20",
      status: "failed",
      userId: "learner-c",
    },
  ] as const satisfies readonly Readonly<{
    createdAt: string
    failureCode: AiFeedbackSeedFailureCode | null
    id: string
    idempotencyKey: string
    lessonIndex: 0 | 1
    quotaDate: string
    status: "failed" | "succeeded"
    userId: string
  }>[]

  for (const attempt of attempts) {
    insertAiFeedbackAttempt(sqlite, {
      course,
      createdAt: attempt.createdAt,
      failureCode: attempt.failureCode,
      id: attempt.id,
      idempotencyKey: attempt.idempotencyKey,
      lessonId: course.lessonIds[attempt.lessonIndex],
      quotaDate: attempt.quotaDate,
      resultJson: attempt.status === "succeeded" ? "{}" : null,
      status: attempt.status,
      stepId: course.stepIds[attempt.lessonIndex],
      userId: attempt.userId,
    })
  }
}
