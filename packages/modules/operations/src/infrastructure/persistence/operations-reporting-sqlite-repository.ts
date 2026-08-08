import type { Database } from "bun:sqlite"
import type { CourseId, LessonId } from "@workspace/types/ids"
import { platformDayBoundary } from "@workspace/kernel/day-boundary"

import type {
  OperationsAiFeedbackLessonFailure,
  OperationsDashboard,
  OperationsLessonAnalyticsItem,
  OperationsLessonAnalyticsSort,
  OperationsReportingRepository,
  OperationsSortDirection,
} from "#operations/application/ports/operations-reporting-repository"

type DashboardRow = Readonly<{
  activeUsersLast7Days: number
  completedLessons: number
  createdWritings: number
  firstLessonStarts: number
  matureCohortLearners: number
  revisedAfterSelfCheckWritings: number
  returnedLearners: number
  selfCheckStartedWritings: number
  totalUsers: number
}>

type DailySeriesRow = Readonly<{
  completions: number
  date: string
  returns: number | null
  returnStatus: "available" | "empty" | "immature"
  signups: number
  starts: number
}>

type LessonAnalyticsRow = Readonly<{
  completed: number
  completionRate: number
  courseId: string
  courseTitle: string
  dropOffRate: number
  lessonId: string
  lessonTitle: string
  started: number
}>

type AiFeedbackQualityRow = Readonly<{
  failureCount: number
  inputTokens: number
  latencyAverageMs: number | null
  latencySampleCount: number
  latencyTotalMs: number
  outputTokens: number
  requestCount: number
  retryCount: number
  successCount: number
  tokenSampleCount: number
}>

type AiFeedbackLessonFailureRow = Readonly<{
  courseId: string
  courseTitle: string
  failureCount: number
  failureRate: number
  lessonId: string
  lessonTitle: string
  requestCount: number
}>

const dashboardSql = `
  WITH
  eligible_learners AS (
    SELECT user_id AS id
    FROM identity_reporting_learners
  ),
  first_starts AS (
    SELECT
      progress.user_id,
      date(
        min(progress.started_at) / 1000,
        'unixepoch',
        ?4
      ) AS first_start_date
    FROM learning_reporting_lesson_progress AS progress
    INNER JOIN eligible_learners
      ON eligible_learners.id = progress.user_id
    GROUP BY progress.user_id
  ),
  mature_cohort AS (
    SELECT user_id, first_start_date
    FROM first_starts
    WHERE first_start_date <= ?3
  ),
  returned_cohort AS (
    SELECT mature_cohort.user_id
    FROM mature_cohort
    WHERE EXISTS (
      SELECT 1
      FROM learning_reporting_activity_days AS activity
      WHERE activity.user_id = mature_cohort.user_id
        AND activity.activity_date > mature_cohort.first_start_date
        AND activity.activity_date <= date(
          mature_cohort.first_start_date,
          '+7 days'
        )
    )
  )
  SELECT
    (
      SELECT count(DISTINCT activity.user_id)
      FROM learning_reporting_activity_days AS activity
      INNER JOIN eligible_learners
        ON eligible_learners.id = activity.user_id
      WHERE activity.activity_date BETWEEN ?1 AND ?2
    ) AS activeUsersLast7Days,
    (
      SELECT count(*)
      FROM learning_reporting_lesson_progress AS progress
      INNER JOIN eligible_learners
        ON eligible_learners.id = progress.user_id
      WHERE progress.status = 'completed'
    ) AS completedLessons,
    (
      SELECT count(*)
      FROM writing_reporting_events AS event
      INNER JOIN eligible_learners
        ON eligible_learners.id = event.user_id
      WHERE event.event_type = 'writing_created'
    ) AS createdWritings,
    (SELECT count(*) FROM first_starts) AS firstLessonStarts,
    (SELECT count(*) FROM mature_cohort) AS matureCohortLearners,
    (
      SELECT count(*)
      FROM writing_reporting_events AS event
      INNER JOIN eligible_learners
        ON eligible_learners.id = event.user_id
      WHERE event.event_type = 'revised_after_self_check'
    ) AS revisedAfterSelfCheckWritings,
    (SELECT count(*) FROM returned_cohort) AS returnedLearners,
    (
      SELECT count(*)
      FROM writing_reporting_events AS event
      INNER JOIN eligible_learners
        ON eligible_learners.id = event.user_id
      WHERE event.event_type = 'self_check_started'
    ) AS selfCheckStartedWritings,
    (SELECT count(*) FROM eligible_learners) AS totalUsers
`

const dailySeriesSql = `
  WITH RECURSIVE
  date_range(date_key) AS (
    SELECT ?1
    UNION ALL
    SELECT date(date_key, '+1 day')
    FROM date_range
    WHERE date_key < ?2
  ),
  eligible_learners AS (
    SELECT user_id AS id, created_at
    FROM identity_reporting_learners
  ),
  first_starts AS (
    SELECT
      progress.user_id,
      date(
        min(progress.started_at) / 1000,
        'unixepoch',
        ?4
      ) AS first_start_date
    FROM learning_reporting_lesson_progress AS progress
    INNER JOIN eligible_learners
      ON eligible_learners.id = progress.user_id
    GROUP BY progress.user_id
  ),
  signup_counts AS (
    SELECT
      date(created_at / 1000, 'unixepoch', ?4) AS date_key,
      count(*) AS count
    FROM eligible_learners
    GROUP BY date_key
  ),
  start_counts AS (
    SELECT first_start_date AS date_key, count(*) AS count
    FROM first_starts
    GROUP BY first_start_date
  ),
  completion_counts AS (
    SELECT
      date(
        progress.completed_at / 1000,
        'unixepoch',
        ?4
      ) AS date_key,
      count(*) AS count
    FROM learning_reporting_lesson_progress AS progress
    INNER JOIN eligible_learners
      ON eligible_learners.id = progress.user_id
    WHERE progress.status = 'completed'
      AND progress.completed_at IS NOT NULL
    GROUP BY date_key
  ),
  return_counts AS (
    SELECT
      first_starts.first_start_date AS date_key,
      count(*) AS count
    FROM first_starts
    WHERE EXISTS (
      SELECT 1
      FROM learning_reporting_activity_days AS activity
      WHERE activity.user_id = first_starts.user_id
        AND activity.activity_date > first_starts.first_start_date
        AND activity.activity_date <= date(
          first_starts.first_start_date,
          '+7 days'
        )
    )
    GROUP BY first_starts.first_start_date
  )
  SELECT
    coalesce(completion_counts.count, 0) AS completions,
    date_range.date_key AS date,
    CASE
      WHEN coalesce(start_counts.count, 0) = 0 THEN 0
      WHEN date_range.date_key > ?3 THEN NULL
      ELSE coalesce(return_counts.count, 0)
    END AS returns,
    CASE
      WHEN coalesce(start_counts.count, 0) = 0 THEN 'empty'
      WHEN date_range.date_key > ?3 THEN 'immature'
      ELSE 'available'
    END AS returnStatus,
    coalesce(signup_counts.count, 0) AS signups,
    coalesce(start_counts.count, 0) AS starts
  FROM date_range
  LEFT JOIN signup_counts ON signup_counts.date_key = date_range.date_key
  LEFT JOIN start_counts ON start_counts.date_key = date_range.date_key
  LEFT JOIN completion_counts
    ON completion_counts.date_key = date_range.date_key
  LEFT JOIN return_counts ON return_counts.date_key = date_range.date_key
  ORDER BY date_range.date_key
`

const lessonAnalyticsCte = `
  WITH
  eligible_learners AS (
    SELECT user_id AS id
    FROM identity_reporting_learners
  ),
  current_lessons AS (
    SELECT
      course_id,
      curriculum_version_id,
      course_title,
      lesson_id,
      lesson_title
    FROM content_reporting_current_lessons
  ),
  progress_counts AS (
    SELECT
      progress.course_id,
      progress.curriculum_version_id,
      progress.lesson_id,
      count(DISTINCT progress.user_id) AS started,
      count(
        DISTINCT CASE
          WHEN progress.status = 'completed' THEN progress.user_id
        END
      ) AS completed
    FROM learning_reporting_lesson_progress AS progress
    INNER JOIN eligible_learners
      ON eligible_learners.id = progress.user_id
    GROUP BY
      progress.course_id,
      progress.curriculum_version_id,
      progress.lesson_id
  ),
  lesson_analytics AS (
    SELECT
      coalesce(progress_counts.completed, 0) AS completed,
      CASE
        WHEN coalesce(progress_counts.started, 0) = 0 THEN 0
        ELSE cast(
          round(
            100.0 * progress_counts.completed / progress_counts.started
          ) AS integer
        )
      END AS completion_rate,
      current_lessons.course_id,
      current_lessons.course_title,
      CASE
        WHEN coalesce(progress_counts.started, 0) = 0 THEN 0
        ELSE 100 - cast(
          round(
            100.0 * progress_counts.completed / progress_counts.started
          ) AS integer
        )
      END AS drop_off_rate,
      current_lessons.lesson_id,
      current_lessons.lesson_title,
      coalesce(progress_counts.started, 0) AS started
    FROM current_lessons
    LEFT JOIN progress_counts
      ON progress_counts.course_id = current_lessons.course_id
      AND progress_counts.curriculum_version_id =
        current_lessons.curriculum_version_id
      AND progress_counts.lesson_id = current_lessons.lesson_id
  )
`

const aiFeedbackQualitySql = `
  WITH eligible_learners AS (
    SELECT user_id AS id
    FROM identity_reporting_learners
  )
  SELECT
    coalesce(
      sum(
        CASE
          WHEN attempt.status IN ('failed', 'expired') THEN 1
          ELSE 0
        END
      ),
      0
    ) AS failureCount,
    coalesce(sum(attempt.input_token_count), 0) AS inputTokens,
    avg(attempt.latency_ms) AS latencyAverageMs,
    count(attempt.latency_ms) AS latencySampleCount,
    coalesce(sum(attempt.latency_ms), 0) AS latencyTotalMs,
    coalesce(sum(attempt.output_token_count), 0) AS outputTokens,
    count(*) AS requestCount,
    coalesce(
      sum(CASE WHEN attempt.attempt_number > 1 THEN 1 ELSE 0 END),
      0
    ) AS retryCount,
    coalesce(
      sum(CASE WHEN attempt.status = 'succeeded' THEN 1 ELSE 0 END),
      0
    ) AS successCount,
    coalesce(
      sum(
        CASE
          WHEN attempt.input_token_count IS NOT NULL THEN 1
          ELSE 0
        END
      ),
      0
    ) AS tokenSampleCount
  FROM ai_feedback_reporting_attempts AS attempt
  INNER JOIN eligible_learners
    ON eligible_learners.id = attempt.user_id
  WHERE attempt.created_at >= ?1
    AND attempt.created_at < ?2
`

const aiFeedbackFailureCountsSql = `
  WITH eligible_learners AS (
    SELECT user_id AS id
    FROM identity_reporting_learners
  )
  SELECT attempt.failure_code AS code, count(*) AS count
  FROM ai_feedback_reporting_attempts AS attempt
  INNER JOIN eligible_learners
    ON eligible_learners.id = attempt.user_id
  WHERE attempt.created_at >= ?1
    AND attempt.created_at < ?2
    AND attempt.failure_code IS NOT NULL
  GROUP BY attempt.failure_code
  ORDER BY attempt.failure_code
`

const aiFeedbackLessonFailuresSql = `
  WITH
  eligible_learners AS (
    SELECT user_id AS id
    FROM identity_reporting_learners
  ),
  current_lessons AS (
    SELECT
      course_id,
      course_title,
      lesson_id,
      lesson_title
    FROM content_reporting_current_lessons
  ),
  attempt_counts AS (
    SELECT
      attempt.course_id,
      attempt.lesson_id,
      sum(
        CASE
          WHEN attempt.status IN ('failed', 'expired') THEN 1
          ELSE 0
        END
      ) AS failure_count,
      count(*) AS request_count
    FROM ai_feedback_reporting_attempts AS attempt
    INNER JOIN eligible_learners
      ON eligible_learners.id = attempt.user_id
    WHERE attempt.quota_date BETWEEN ?1 AND ?2
    GROUP BY attempt.course_id, attempt.lesson_id
  )
  SELECT
    current_lessons.course_id AS courseId,
    current_lessons.course_title AS courseTitle,
    attempt_counts.failure_count AS failureCount,
    round(
      1000.0 * attempt_counts.failure_count / attempt_counts.request_count
    ) / 10.0 AS failureRate,
    current_lessons.lesson_id AS lessonId,
    current_lessons.lesson_title AS lessonTitle,
    attempt_counts.request_count AS requestCount
  FROM current_lessons
  INNER JOIN attempt_counts
    ON attempt_counts.course_id = current_lessons.course_id
    AND attempt_counts.lesson_id = current_lessons.lesson_id
  WHERE attempt_counts.failure_count > 0
  ORDER BY
    failureRate DESC,
    failureCount DESC,
    requestCount DESC,
    current_lessons.course_title COLLATE NOCASE ASC,
    current_lessons.lesson_title COLLATE NOCASE ASC,
    current_lessons.course_id ASC,
    current_lessons.lesson_id ASC
  LIMIT 8
`

export function createSqliteOperationsReportingRepository(
  sqlite: Database
): OperationsReportingRepository {
  sqlite.exec("PRAGMA query_only = ON")
  const queryOnly = sqlite
    .query<{ readonly query_only: number }, []>("PRAGMA query_only")
    .get()?.query_only
  if (queryOnly !== 1) {
    throw new Error("Operations reporting connection must be query-only")
  }

  return {
    readAiFeedbackQuality(input) {
      const from = input.from.getTime()
      const to = input.to.getTime()
      const aggregate = sqlite
        .query<AiFeedbackQualityRow, [number, number]>(aiFeedbackQualitySql)
        .get(from, to)
      if (aggregate === null) {
        throw new Error("AI feedback quality aggregate could not be read")
      }
      const failureCounts = sqlite
        .query<
          { readonly code: string; readonly count: number },
          [number, number]
        >(aiFeedbackFailureCountsSql)
        .all(from, to)

      return {
        failureCount: aggregate.failureCount,
        failureCounts,
        from: input.from.toISOString(),
        latency: {
          averageMs: aggregate.latencyAverageMs,
          sampleCount: aggregate.latencySampleCount,
          totalMs: aggregate.latencyTotalMs,
        },
        requestCount: aggregate.requestCount,
        retryCount: aggregate.retryCount,
        status: aggregate.requestCount === 0 ? "empty" : "available",
        successCount: aggregate.successCount,
        successRate:
          aggregate.requestCount === 0
            ? null
            : aggregate.successCount / aggregate.requestCount,
        to: input.to.toISOString(),
        tokens: {
          input: aggregate.inputTokens,
          output: aggregate.outputTokens,
          sampleCount: aggregate.tokenSampleCount,
        },
      }
    },
    readAnalytics(input) {
      const dailySeries = sqlite
        .query<DailySeriesRow, [string, string, string, string]>(dailySeriesSql)
        .all(
          input.from,
          input.to,
          input.matureCohortThrough,
          platformDayBoundary.sqliteOffset
        )
      const worstAiFeedbackLessons = readWorstAiFeedbackLessons(sqlite, input)
      const worstLessons = readWorstLessons(sqlite)

      return {
        dailySeries,
        from: input.from,
        matureCohortThrough: input.matureCohortThrough,
        to: input.to,
        worstAiFeedbackLessons,
        worstLessons,
      }
    },
    readDashboard(input) {
      const row = sqlite
        .query<DashboardRow, [string, string, string, string]>(dashboardSql)
        .get(
          input.activeFrom,
          input.reportDate,
          input.matureCohortThrough,
          platformDayBoundary.sqliteOffset
        )
      if (row === null) {
        throw new Error("Operations dashboard aggregate could not be read")
      }

      return {
        activeWindow: {
          from: input.activeFrom,
          to: input.reportDate,
        },
        asOfDate: input.reportDate,
        metrics: {
          activeUsersLast7Days: row.activeUsersLast7Days,
          activationRate: {
            ...createMetricRate(row.firstLessonStarts, row.totalUsers),
            status: row.totalUsers === 0 ? "empty" : "available",
          },
          completedLessons: row.completedLessons,
          d7ReturnRate: {
            ...createMetricRate(row.returnedLearners, row.matureCohortLearners),
            matureCohortThrough: input.matureCohortThrough,
            status: readD7ReturnStatus(
              row.firstLessonStarts,
              row.matureCohortLearners
            ),
          },
          writingRevisionAfterSelfCheckRate: {
            ...createMetricRate(
              row.revisedAfterSelfCheckWritings,
              row.selfCheckStartedWritings
            ),
            status: row.selfCheckStartedWritings === 0 ? "empty" : "available",
          },
          writingSelfCheckStartRate: {
            ...createMetricRate(
              row.selfCheckStartedWritings,
              row.createdWritings
            ),
            status: row.createdWritings === 0 ? "empty" : "available",
          },
        },
      } satisfies OperationsDashboard
    },
    readLessonAnalytics(input) {
      const normalizedQuery = input.query.trim()
      const totalItems =
        sqlite
          .query<{ readonly count: number }, [string]>(
            `${lessonAnalyticsCte}
             SELECT count(*) AS count
             FROM lesson_analytics
             WHERE ?1 = ''
               OR instr(lower(course_title), lower(?1)) > 0
               OR instr(lower(lesson_title), lower(?1)) > 0`
          )
          .get(normalizedQuery)?.count ?? 0
      const orderBy = createLessonAnalyticsOrderBy(input.sort, input.direction)
      const offset = (input.page - 1) * input.pageSize
      const rows = sqlite
        .query<LessonAnalyticsRow, [string, number, number]>(
          `${lessonAnalyticsCte}
           SELECT
             completed,
             completion_rate AS completionRate,
             course_id AS courseId,
             course_title AS courseTitle,
             drop_off_rate AS dropOffRate,
             lesson_id AS lessonId,
             lesson_title AS lessonTitle,
             started
           FROM lesson_analytics
           WHERE ?1 = ''
             OR instr(lower(course_title), lower(?1)) > 0
             OR instr(lower(lesson_title), lower(?1)) > 0
           ORDER BY ${orderBy},
             course_title COLLATE NOCASE ASC,
             lesson_title COLLATE NOCASE ASC,
             lesson_id ASC
           LIMIT ?2 OFFSET ?3`
        )
        .all(normalizedQuery, input.pageSize, offset)

      return {
        items: rows.map(toLessonAnalyticsItem),
        page: input.page,
        pageSize: input.pageSize,
        totalItems,
        totalPages:
          totalItems === 0 ? 0 : Math.ceil(totalItems / input.pageSize),
      }
    },
  }
}

function readWorstAiFeedbackLessons(
  sqlite: Database,
  input: Readonly<{ from: string; to: string }>
): readonly OperationsAiFeedbackLessonFailure[] {
  return sqlite
    .query<AiFeedbackLessonFailureRow, [string, string]>(
      aiFeedbackLessonFailuresSql
    )
    .all(input.from, input.to)
    .map((row) => ({
      ...row,
      courseId: row.courseId as CourseId,
      lessonId: row.lessonId as LessonId,
    }))
}

function readWorstLessons(
  sqlite: Database
): readonly OperationsLessonAnalyticsItem[] {
  return sqlite
    .query<LessonAnalyticsRow, []>(
      `${lessonAnalyticsCte}
       SELECT
         completed,
         completion_rate AS completionRate,
         course_id AS courseId,
         course_title AS courseTitle,
         drop_off_rate AS dropOffRate,
         lesson_id AS lessonId,
         lesson_title AS lessonTitle,
         started
       FROM lesson_analytics
       WHERE started > 0
       ORDER BY
         completion_rate ASC,
         drop_off_rate DESC,
         started DESC,
         course_title COLLATE NOCASE ASC,
         lesson_title COLLATE NOCASE ASC,
         lesson_id ASC
       LIMIT 8`
    )
    .all()
    .map(toLessonAnalyticsItem)
}

function toLessonAnalyticsItem(
  row: LessonAnalyticsRow
): OperationsLessonAnalyticsItem {
  return {
    ...row,
    courseId: row.courseId as CourseId,
    lessonId: row.lessonId as LessonId,
  }
}

function createMetricRate(
  numerator: number,
  denominator: number
): Readonly<{
  denominator: number
  numerator: number
  percentage: number | null
}> {
  return {
    denominator,
    numerator,
    percentage:
      denominator === 0
        ? null
        : Math.round((numerator / denominator) * 1_000) / 10,
  }
}

function readD7ReturnStatus(
  firstLessonStarts: number,
  matureCohortLearners: number
): "available" | "empty" | "immature" {
  if (firstLessonStarts === 0) return "empty"
  return matureCohortLearners === 0 ? "immature" : "available"
}

function createLessonAnalyticsOrderBy(
  sort: OperationsLessonAnalyticsSort,
  direction: OperationsSortDirection
): string {
  const directionSql = direction === "asc" ? "ASC" : "DESC"
  switch (sort) {
    case "completionRate":
      return `completion_rate ${directionSql}`
    case "course":
      return `course_title COLLATE NOCASE ${directionSql}`
    case "dropOff":
      return `drop_off_rate ${directionSql}`
    case "lesson":
      return `lesson_title COLLATE NOCASE ${directionSql}`
  }
}
