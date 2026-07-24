import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"
import {
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
} from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"

import { createOperationsReportingQueries } from "#operations/application/operations-reporting"
import { createSqliteOperationsReportingRepository } from "#operations/infrastructure/persistence/operations-reporting-sqlite-repository"

const reportNow = new Date("2026-07-24T03:00:00.000Z")

describe("operations reporting SQL metrics", () => {
  it("첫 시작·D7·완료·이탈을 SQL로 집계하고 deleted learner를 전부 제외한다", async () => {
    const fixture = createReportingFixture()

    try {
      const repository = createSqliteOperationsReportingRepository(
        fixture.readOnly.sqlite
      )
      const reporting = createOperationsReportingQueries({
        observer: () => undefined,
        repository,
      })
      const dashboardResult = await reporting.readDashboard({ now: reportNow })
      const analyticsResult = await reporting.readAnalytics({
        days: 15,
        now: reportNow,
      })
      if (dashboardResult.isErr()) throw new Error("dashboard query failed")
      if (analyticsResult.isErr()) throw new Error("analytics query failed")

      expect(dashboardResult.value).toEqual({
        activeWindow: { from: "2026-07-18", to: "2026-07-24" },
        asOfDate: "2026-07-24",
        metrics: {
          activeUsersLast7Days: 1,
          activationRate: {
            denominator: 4,
            numerator: 3,
            percentage: 75,
            status: "available",
          },
          completedLessons: 2,
          d7ReturnRate: {
            denominator: 2,
            matureCohortThrough: "2026-07-16",
            numerator: 1,
            percentage: 50,
            status: "available",
          },
          firstLessonStarts: 3,
          totalUsers: 4,
        },
      })
      expect(readDailyPoint(analyticsResult.value, "2026-07-10")).toEqual({
        completions: 0,
        date: "2026-07-10",
        returns: 1,
        returnStatus: "available",
        signups: 0,
        starts: 2,
      })
      expect(readDailyPoint(analyticsResult.value, "2026-07-12")).toMatchObject(
        {
          completions: 1,
        }
      )
      expect(readDailyPoint(analyticsResult.value, "2026-07-20")).toEqual({
        completions: 0,
        date: "2026-07-20",
        returns: null,
        returnStatus: "immature",
        signups: 1,
        starts: 1,
      })
      expect(readDailyPoint(analyticsResult.value, "2026-07-24")).toMatchObject(
        {
          signups: 1,
        }
      )
      expect(analyticsResult.value.worstLessons[0]).toMatchObject({
        completed: 2,
        completionRate: 67,
        dropOffRate: 33,
        lessonId: "lesson-1",
        started: 3,
      })
      expect(analyticsResult.value.worstAiFeedbackLessons).toEqual([
        {
          courseId: "course-1",
          courseTitle: "글쓰기 코스",
          failureCount: 1,
          failureRate: 50,
          lessonId: "lesson-2",
          lessonTitle: "두 번째 레슨",
          requestCount: 2,
        },
        {
          courseId: "course-1",
          courseTitle: "글쓰기 코스",
          failureCount: 1,
          failureRate: 50,
          lessonId: "lesson-1",
          lessonTitle: "첫 번째 레슨",
          requestCount: 2,
        },
      ])
      expect(
        JSON.stringify(analyticsResult.value.worstAiFeedbackLessons)
      ).not.toContain("절대 노출하지 않을 답안")
    } finally {
      fixture.close()
    }
  })

  it("레슨 검색·허용 정렬·pagination을 SQL에서 처리한다", () => {
    const fixture = createReportingFixture()

    try {
      const repository = createSqliteOperationsReportingRepository(
        fixture.readOnly.sqlite
      )
      const searched = repository.readLessonAnalytics({
        direction: "asc",
        page: 1,
        pageSize: 10,
        query: "두 번째",
        sort: "lesson",
      })
      const secondPage = repository.readLessonAnalytics({
        direction: "desc",
        page: 2,
        pageSize: 1,
        query: "",
        sort: "dropOff",
      })

      expect(searched).toMatchObject({
        items: [{ lessonId: "lesson-2", started: 0 }],
        totalItems: 1,
        totalPages: 1,
      })
      expect(secondPage).toMatchObject({
        items: [{ lessonId: "lesson-2" }],
        page: 2,
        pageSize: 1,
        totalItems: 2,
        totalPages: 2,
      })
    } finally {
      fixture.close()
    }
  })

  it("빈 데이터와 미성숙 cohort를 구분하고 reporting connection의 mutation을 거부한다", async () => {
    const directory = mkdtempSync(join(tmpdir(), "operations-reporting-empty-"))
    const databasePath = join(directory, "reporting.sqlite")
    const writer = createWritingAppDatabase(databasePath)
    runCurrentTestMigration(writer.sqlite)
    writer.close()
    const readOnly = createReadOnlyWritingAppDatabase(databasePath)

    try {
      const repository = createSqliteOperationsReportingRepository(
        readOnly.sqlite
      )
      const reporting = createOperationsReportingQueries({
        observer: () => undefined,
        repository,
      })
      const dashboard = await reporting.readDashboard({ now: reportNow })
      const analytics = await reporting.readAnalytics({
        days: 3,
        now: reportNow,
      })
      if (dashboard.isErr()) throw new Error("empty dashboard query failed")
      if (analytics.isErr()) throw new Error("empty analytics query failed")

      expect(dashboard.value.metrics.activationRate).toEqual({
        denominator: 0,
        numerator: 0,
        percentage: null,
        status: "empty",
      })
      expect(dashboard.value.metrics.d7ReturnRate).toEqual({
        denominator: 0,
        matureCohortThrough: "2026-07-16",
        numerator: 0,
        percentage: null,
        status: "empty",
      })
      expect(analytics.value.dailySeries).toHaveLength(3)
      expect(analytics.value.dailySeries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            returns: 0,
            returnStatus: "empty",
          }),
        ])
      )
      expect(
        repository.readLessonAnalytics({
          direction: "asc",
          page: 1,
          pageSize: 10,
          query: "",
          sort: "lesson",
        })
      ).toMatchObject({ items: [], totalItems: 0, totalPages: 0 })
      expect(() =>
        readOnly.sqlite.exec(`
          INSERT INTO user (
            id, name, email, email_verified, created_at, updated_at
          )
          VALUES ('mutation', 'mutation', 'mutation@example.com', 1, 0, 0)
        `)
      ).toThrow(/read.?only/i)
    } finally {
      readOnly.close()
      rmSync(directory, { force: true, recursive: true })
    }
  })
})

function createReportingFixture(): Readonly<{
  close: () => void
  readOnly: ReturnType<typeof createReadOnlyWritingAppDatabase>
}> {
  const directory = mkdtempSync(join(tmpdir(), "operations-reporting-"))
  const databasePath = join(directory, "reporting.sqlite")
  const writer = createWritingAppDatabase(databasePath)

  try {
    runCurrentTestMigration(writer.sqlite)
    insertLearner(writer.sqlite, {
      createdAt: "2026-07-01T09:00:00+09:00",
      id: "learner-a",
      status: "active",
    })
    insertLearner(writer.sqlite, {
      createdAt: "2026-07-01T09:00:00+09:00",
      id: "learner-b",
      status: "active",
    })
    insertLearner(writer.sqlite, {
      createdAt: "2026-07-20T09:00:00+09:00",
      id: "learner-c",
      status: "active",
    })
    insertLearner(writer.sqlite, {
      createdAt: "2026-07-20T09:00:00+09:00",
      id: "learner-d",
      status: "deleted",
    })
    insertLearner(writer.sqlite, {
      createdAt: "2026-07-24T09:00:00+09:00",
      id: "learner-e",
      status: "active",
    })
    insertPublishedCourse(writer.sqlite)
    insertProgress(writer.sqlite, {
      completedAt: "2026-07-12T10:00:00+09:00",
      startedAt: "2026-07-10T09:00:00+09:00",
      status: "completed",
      userId: "learner-a",
    })
    insertProgress(writer.sqlite, {
      completedAt: null,
      startedAt: "2026-07-10T10:00:00+09:00",
      status: "in_progress",
      userId: "learner-b",
    })
    insertProgress(writer.sqlite, {
      completedAt: "2026-07-22T10:00:00+09:00",
      startedAt: "2026-07-20T09:00:00+09:00",
      status: "completed",
      userId: "learner-c",
    })
    insertProgress(writer.sqlite, {
      completedAt: "2026-07-12T11:00:00+09:00",
      startedAt: "2026-07-10T11:00:00+09:00",
      status: "completed",
      userId: "learner-d",
    })
    insertAiFeedbackAttempts(writer.sqlite)
    insertActivityDays(writer.sqlite, "learner-a", ["2026-07-10", "2026-07-11"])
    insertActivityDays(writer.sqlite, "learner-b", ["2026-07-10"])
    insertActivityDays(writer.sqlite, "learner-c", ["2026-07-20", "2026-07-21"])
    insertActivityDays(writer.sqlite, "learner-d", ["2026-07-10", "2026-07-12"])
  } finally {
    writer.close()
  }

  const readOnly = createReadOnlyWritingAppDatabase(databasePath)
  return {
    close() {
      readOnly.close()
      rmSync(directory, { force: true, recursive: true })
    },
    readOnly,
  }
}

function insertLearner(
  sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"],
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

function insertPublishedCourse(
  sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"]
): void {
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

function insertProgress(
  sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"],
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

function insertActivityDays(
  sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"],
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

function insertAiFeedbackAttempts(
  sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"]
): void {
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

function readDailyPoint(
  analytics: Readonly<{
    dailySeries: readonly Readonly<{ date: string }>[]
  }>,
  date: string
) {
  const point = analytics.dailySeries.find(
    (candidate) => candidate.date === date
  )
  if (point === undefined) throw new Error(`daily point missing: ${date}`)
  return point
}
