import type { SqlDatabaseClient as Database } from "@workspace/db/sql-client"
import type { CourseId, LessonId } from "@workspace/types/ids"
import { createFts5Phrase } from "@workspace/db/fts5"

import type {
  OperationsDashboard,
  OperationsLessonAnalyticsCursor,
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
  revisedAfterCheckWritings: number
  returnedLearners: number
  checkSucceededWritings: number
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

const dashboardSql = `
  WITH metric_totals AS (
    SELECT
      coalesce(sum(signups), 0) AS total_users,
      coalesce(sum(first_starts), 0) AS first_starts,
      coalesce(sum(CASE WHEN date_key <= ?3 THEN first_starts ELSE 0 END), 0)
        AS mature_starts,
      coalesce(sum(completions), 0) AS completed_lessons,
      coalesce(sum(CASE WHEN date_key <= ?3 THEN returned_learners ELSE 0 END), 0)
        AS returned_learners,
      coalesce(sum(created_writings), 0) AS created_writings,
      coalesce(sum(check_succeeded_writings), 0) AS check_succeeded_writings,
      coalesce(sum(revised_after_check_writings), 0)
        AS revised_after_check_writings
    FROM operations_reporting_daily_metrics
  )
  SELECT
    (
      SELECT count(DISTINCT activity.user_id)
      FROM learning_reporting_activity_days AS activity
      INNER JOIN identity_reporting_learners AS learner
        ON learner.user_id = activity.user_id
      WHERE activity.activity_date BETWEEN ?1 AND ?2
    ) AS activeUsersLast7Days,
    completed_lessons AS completedLessons,
    created_writings AS createdWritings,
    first_starts AS firstLessonStarts,
    mature_starts AS matureCohortLearners,
    revised_after_check_writings AS revisedAfterCheckWritings,
    returned_learners AS returnedLearners,
    check_succeeded_writings AS checkSucceededWritings,
    total_users AS totalUsers
  FROM metric_totals
`

const dailySeriesSql = `
  WITH RECURSIVE
  date_range(date_key) AS (
    SELECT ?1
    UNION ALL
    SELECT date(date_key, '+1 day')
    FROM date_range
    WHERE date_key < ?2
  )
  SELECT
    coalesce(metric.completions, 0) AS completions,
    date_range.date_key AS date,
    CASE
      WHEN coalesce(metric.first_starts, 0) = 0 THEN 0
      WHEN date_range.date_key > ?3 THEN NULL
      ELSE coalesce(metric.returned_learners, 0)
    END AS returns,
    CASE
      WHEN coalesce(metric.first_starts, 0) = 0 THEN 'empty'
      WHEN date_range.date_key > ?3 THEN 'immature'
      ELSE 'available'
    END AS returnStatus,
    coalesce(metric.signups, 0) AS signups,
    coalesce(metric.first_starts, 0) AS starts
  FROM date_range
  LEFT JOIN operations_reporting_daily_metrics AS metric
    ON metric.date_key = date_range.date_key
  ORDER BY date_range.date_key
`

const lessonAnalyticsCte = `
  WITH
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
      metric.course_id,
      metric.curriculum_version_id,
      metric.lesson_id,
      metric.started,
      metric.completed
    FROM operations_reporting_lesson_metrics AS metric
    INNER JOIN current_lessons
      ON current_lessons.course_id = metric.course_id
      AND current_lessons.curriculum_version_id = metric.curriculum_version_id
      AND current_lessons.lesson_id = metric.lesson_id
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
      current_lessons.curriculum_version_id,
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

export async function createSqliteOperationsReportingRepository(
  sqlite: Database
): Promise<OperationsReportingRepository> {
  return {
    async readAnalytics(input) {
      const dailySeries = await sqlite
        .query<DailySeriesRow, [string, string, string]>(dailySeriesSql)
        .all(input.from, input.to, input.matureCohortThrough)
      const worstLessons = await readWorstLessons(sqlite)

      return {
        dailySeries,
        from: input.from,
        matureCohortThrough: input.matureCohortThrough,
        to: input.to,
        worstLessons,
      }
    },
    async readDashboard(input) {
      const row = await sqlite
        .query<DashboardRow, [string, string, string]>(dashboardSql)
        .get(input.activeFrom, input.reportDate, input.matureCohortThrough)
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
          writingCheckSuccessRate: {
            ...createMetricRate(
              row.checkSucceededWritings,
              row.createdWritings
            ),
            status: row.createdWritings === 0 ? "empty" : "available",
          },
          writingRevisionAfterCheckRate: {
            ...createMetricRate(
              row.revisedAfterCheckWritings,
              row.checkSucceededWritings
            ),
            status: row.checkSucceededWritings === 0 ? "empty" : "available",
          },
        },
      } satisfies OperationsDashboard
    },
    async readLessonAnalytics(input) {
      const normalizedQuery = input.query.trim()
      const cursor = input.cursor ?? null
      const orderBy = createLessonAnalyticsOrderBy(
        input.sort,
        input.direction,
        cursor?.direction ?? "older"
      )
      const cursorFilter = createLessonAnalyticsCursorFilter(
        cursor,
        input.sort,
        input.direction
      )
      const isLegacyOffset = cursor === null && input.page > 1
      const limit = isLegacyOffset ? input.pageSize : input.pageSize + 1
      const offset = isLegacyOffset ? (input.page - 1) * input.pageSize : 0
      const searchPhrase =
        normalizedQuery === "" ? "" : createFts5Phrase(normalizedQuery)
      const bindings = [searchPhrase, ...cursorFilter.bindings, limit, offset]
      const limitParameter = cursorFilter.bindings.length + 2
      const offsetParameter = limitParameter + 1
      const fetchedRows = await sqlite
        .query<LessonAnalyticsRow, (number | string)[]>(
          `${lessonAnalyticsCte}
           , filtered_lesson_analytics AS MATERIALIZED (
             SELECT *
             FROM lesson_analytics
             WHERE ?1 = ''
               OR curriculum_version_id IN (
                 SELECT document.curriculum_version_id
                 FROM course_curriculum_version_title_fts AS search
                 INNER JOIN course_curriculum_version_title_search_documents AS document
                   ON document.rowid = search.rowid
                 WHERE course_curriculum_version_title_fts MATCH ?1
               )
               OR (curriculum_version_id, lesson_id) IN (
                 SELECT document.curriculum_version_id, document.lesson_id
                 FROM operations_reporting_lesson_title_fts AS search
                 INNER JOIN operations_reporting_lesson_title_search_documents AS document
                   ON document.rowid = search.rowid
                 WHERE operations_reporting_lesson_title_fts MATCH ?1
               )
           )
           SELECT
             completed,
             completion_rate AS completionRate,
             course_id AS courseId,
             course_title AS courseTitle,
             drop_off_rate AS dropOffRate,
             lesson_id AS lessonId,
             lesson_title AS lessonTitle,
             started
           FROM filtered_lesson_analytics
           ${cursorFilter.sql}
           ORDER BY ${orderBy}
           LIMIT ?${limitParameter} OFFSET ?${offsetParameter}`
        )
        .all(...bindings)
      const rows =
        cursor?.direction === "newer" ? fetchedRows.reverse() : fetchedRows
      const hasExtraItem = rows.length > input.pageSize
      const pageRows =
        cursor?.direction === "newer" && hasExtraItem
          ? rows.slice(1)
          : rows.slice(0, input.pageSize)
      const hasNextPage =
        cursor?.direction === "newer" ? pageRows.length > 0 : hasExtraItem
      const hasPreviousPage =
        cursor?.direction === "newer"
          ? hasExtraItem
          : (cursor !== null || isLegacyOffset) && pageRows.length > 0

      return {
        hasNextPage,
        hasPreviousPage,
        items: pageRows.map(toLessonAnalyticsItem),
        page: input.page,
        pageSize: input.pageSize,
      }
    },
  }
}

async function readWorstLessons(
  sqlite: Database
): Promise<readonly OperationsLessonAnalyticsItem[]> {
  return (
    await sqlite
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
  ).map(toLessonAnalyticsItem)
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
  direction: OperationsSortDirection,
  navigation: OperationsLessonAnalyticsCursor["direction"]
): string {
  const primaryDirection = readNavigationDirection(direction, navigation)
  const tieDirection = readNavigationDirection("asc", navigation)
  switch (sort) {
    case "completionRate":
      return `completion_rate ${primaryDirection}, course_title COLLATE NOCASE ${tieDirection}, lesson_title COLLATE NOCASE ${tieDirection}, lesson_id ${tieDirection}`
    case "course":
      return `course_title COLLATE NOCASE ${primaryDirection}, lesson_title COLLATE NOCASE ${tieDirection}, lesson_id ${tieDirection}`
    case "dropOff":
      return `drop_off_rate ${primaryDirection}, course_title COLLATE NOCASE ${tieDirection}, lesson_title COLLATE NOCASE ${tieDirection}, lesson_id ${tieDirection}`
    case "lesson":
      return `lesson_title COLLATE NOCASE ${primaryDirection}, course_title COLLATE NOCASE ${tieDirection}, lesson_id ${tieDirection}`
  }
}

function createLessonAnalyticsCursorFilter(
  cursor: OperationsLessonAnalyticsCursor | null,
  sort: OperationsLessonAnalyticsSort,
  direction: OperationsSortDirection
): Readonly<{ bindings: readonly (number | string)[]; sql: string }> {
  if (cursor === null) return { bindings: [], sql: "" }

  const columns = createLessonAnalyticsCursorColumns(sort, direction, cursor)
  const bindings: (number | string)[] = []
  const alternatives = columns.map((column, index) => {
    const equalities = columns.slice(0, index).map((previous) => {
      bindings.push(previous.value)
      return `${previous.expression} = ?${bindings.length + 1}`
    })
    bindings.push(column.value)
    const operator =
      readNavigationDirection(column.direction, cursor.direction) === "ASC"
        ? ">"
        : "<"
    return `(${[...equalities, `${column.expression} ${operator} ?${bindings.length + 1}`].join(" AND ")})`
  })
  return { bindings, sql: `WHERE ${alternatives.join(" OR ")}` }
}

function createLessonAnalyticsCursorColumns(
  sort: OperationsLessonAnalyticsSort,
  direction: OperationsSortDirection,
  cursor: OperationsLessonAnalyticsCursor
) {
  const course = {
    direction: "asc" as const,
    expression: "course_title COLLATE NOCASE",
    value: cursor.courseTitle,
  }
  const lesson = {
    direction: "asc" as const,
    expression: "lesson_title COLLATE NOCASE",
    value: cursor.lessonTitle,
  }
  const id = {
    direction: "asc" as const,
    expression: "lesson_id",
    value: cursor.lessonId,
  }
  const primary = (expression: string) => ({
    direction,
    expression,
    value: cursor.primary,
  })

  switch (sort) {
    case "completionRate":
      return [primary("completion_rate"), course, lesson, id]
    case "course":
      return [primary("course_title COLLATE NOCASE"), lesson, id]
    case "dropOff":
      return [primary("drop_off_rate"), course, lesson, id]
    case "lesson":
      return [primary("lesson_title COLLATE NOCASE"), course, id]
  }
}

function readNavigationDirection(
  direction: OperationsSortDirection,
  navigation: OperationsLessonAnalyticsCursor["direction"]
): "ASC" | "DESC" {
  const reversed = navigation === "newer"
  return (direction === "asc") !== reversed ? "ASC" : "DESC"
}
