import { and, asc, desc, eq, gt, lt, or, sql } from "drizzle-orm"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { WritingAppDatabase } from "@workspace/db/client"
import { createFts5Phrase } from "@workspace/db/fts5"
import type { ContentAssetId, CourseId } from "@workspace/types/ids"

import type { ContentError } from "#content/domain/content-error"
import {
  createCourseId,
  createCurriculumVersionId,
  readCourseVisualKey,
  readCurriculumVersionId,
  type Course,
  type CurriculumDraft,
} from "#content/domain/content-model"
import type {
  ContentCourseRowPage,
  CourseChangeTarget,
  CourseEditorDocument,
  ReadContentCoursesInput,
} from "#content/application/ports/content-ports"
import {
  activeStatus,
  isUniqueConstraintViolation,
  type CourseReadDatabase,
  type WritingAppDatabaseTransaction,
} from "#content/infrastructure/persistence/content-drizzle-shared"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonVersions,
} from "#content/infrastructure/persistence/schema"

export function createCourse(
  database: WritingAppDatabase,
  input: {
    readonly category: string
    readonly courseId: CourseId
    readonly description: string
    readonly now: Date
    readonly title: string
  }
): Result<CourseEditorDocument, ContentError> {
  try {
    return ok(
      database.transaction((transaction) => insertCourse(transaction, input))
    )
  } catch (cause) {
    if (isUniqueConstraintViolation(cause)) {
      return err({ cause, kind: "content-conflict" })
    }
    throw cause
  }
}

function insertCourse(
  transaction: WritingAppDatabaseTransaction,
  input: {
    readonly category?: string
    readonly courseId: CourseId
    readonly description?: string
    readonly now: Date
    readonly title?: string
  }
): CourseEditorDocument {
  const curriculumVersionId = createCurriculumVersionId(input.courseId, 1)
  const sortOrder = readNextCourseSortOrder(transaction)
  const category = input.category ?? "미분류"
  const description = input.description ?? "강의 설명을 입력하세요."
  const title = input.title ?? "새 강의"

  transaction
    .insert(courses)
    .values({
      createdAt: input.now,
      id: input.courseId,
      publishedCurriculumVersionId: null,
      sortOrder,
      status: activeStatus,
    })
    .run()
  transaction
    .insert(courseCurriculumVersions)
    .values({
      category,
      courseId: input.courseId,
      coverAssetId: null,
      createdAt: input.now,
      description,
      editVersion: 0,
      id: curriculumVersionId,
      publishedAt: null,
      revision: 1,
      status: "draft",
      title,
      updatedAt: input.now,
      visualKey: "basic-sentence-writing",
    })
    .run()

  return {
    assets: [],
    category,
    courseId: input.courseId,
    coverAssetId: null,
    curriculumVersionId,
    description,
    editVersion: 0,
    revision: 1,
    title,
    units: [],
  }
}

export function findCourse(
  database: CourseReadDatabase,
  courseId: CourseId
): Course | null {
  const row = database
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .get()
  if (row === undefined) return null

  return {
    createdAt: new Date(row.createdAt),
    id: createCourseId(row.id),
    publishedCurriculumVersionId:
      row.publishedCurriculumVersionId === null
        ? null
        : readCurriculumVersionId(row.publishedCurriculumVersionId),
    sortOrder: row.sortOrder,
    status: row.status,
  }
}

export function readCourseChangeTarget(
  database: CourseReadDatabase,
  courseId: CourseId
): CourseChangeTarget | null {
  const row = database
    .select({
      courseId: courses.id,
      editVersion: courseCurriculumVersions.editVersion,
      status: courses.status,
      title: courseCurriculumVersions.title,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      and(
        eq(courseCurriculumVersions.courseId, courses.id),
        sql`${courseCurriculumVersions.status} = 'draft'`
      )
    )
    .where(eq(courses.id, courseId))
    .get()

  return row === undefined
    ? null
    : {
        courseId: createCourseId(row.courseId),
        editVersion: row.editVersion,
        status: row.status,
        title: row.title,
      }
}

export function saveCourse(
  database: WritingAppDatabase,
  input: {
    readonly course: Course
    readonly expectedStatus: Course["status"]
  }
): Result<Course, ContentError> {
  const updated = database
    .update(courses)
    .set({ status: input.course.status })
    .where(
      and(
        eq(courses.id, input.course.id),
        eq(courses.status, input.expectedStatus)
      )
    )
    .returning({ id: courses.id })
    .get()

  return updated === undefined
    ? err({ kind: "content-conflict" })
    : ok(input.course)
}

export function readCourses(
  database: WritingAppDatabase,
  input: ReadContentCoursesInput
): ContentCourseRowPage {
  const direction = input.cursor === undefined ? "next" : input.direction
  const category = input.category.trim()
  const whereCondition = createReadCoursesWhereCondition({
    category,
    query: input.query.trim(),
    status: input.status,
  })
  const cursorCondition = createCourseCursorCondition({
    cursor: input.cursor,
    direction,
  })
  const unitCountExpression = sql<number>`(
    SELECT count(*)
    FROM ${courseUnitVersions}
    WHERE ${courseUnitVersions.curriculumVersionId} = ${courseCurriculumVersions.id}
      AND ${courseUnitVersions.status} = 'active'
  )`
  const lessonCountExpression = sql<number>`(
    SELECT count(*)
    FROM ${lessonVersions}
    WHERE ${lessonVersions.curriculumVersionId} = ${courseCurriculumVersions.id}
      AND ${lessonVersions.status} = 'active'
  )`
  const rows = database
    .select({
      category: courseCurriculumVersions.category,
      coverAssetId: courseCurriculumVersions.coverAssetId,
      id: courses.id,
      lessonCount: lessonCountExpression,
      revision: courseCurriculumVersions.revision,
      status: courses.status,
      title: courseCurriculumVersions.title,
      unitCount: unitCountExpression,
      visualKey: courseCurriculumVersions.visualKey,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      and(
        eq(courseCurriculumVersions.courseId, courses.id),
        sql`${courseCurriculumVersions.status} = 'draft'`
      )
    )
    .where(and(whereCondition, cursorCondition))
    .orderBy(
      direction === "previous"
        ? desc(courses.sortOrder)
        : asc(courses.sortOrder),
      direction === "previous" ? desc(courses.id) : asc(courses.id)
    )
    .limit(input.pageSize + 1)
    .all()

  const hasMore = rows.length > input.pageSize
  const pageRows = rows.slice(0, input.pageSize)
  if (direction === "previous") pageRows.reverse()
  const first = pageRows.at(0)
  const last = pageRows.at(-1)

  return {
    items: pageRows.map(({ coverAssetId, ...row }) => ({
      ...row,
      coverAssetId:
        coverAssetId === null ? null : (coverAssetId as ContentAssetId),
      id: createCourseId(row.id),
      visualKey: readCourseVisualKey(row.visualKey),
    })),
    nextCursor:
      last === undefined ||
      (direction === "next" && !hasMore) ||
      (direction === "previous" && input.cursor === undefined)
        ? null
        : createCourseId(last.id),
    pageSize: input.pageSize,
    previousCursor:
      first === undefined ||
      (direction === "previous" && !hasMore) ||
      (direction === "next" && input.cursor === undefined)
        ? null
        : createCourseId(first.id),
  }
}

function createCourseCursorCondition(input: {
  readonly cursor?: CourseId
  readonly direction: "next" | "previous"
}) {
  if (input.cursor === undefined) return undefined

  const cursorSortOrder = sql<number>`(
    SELECT ${courses.sortOrder}
    FROM ${courses}
    WHERE ${courses.id} = ${input.cursor}
  )`
  const compareSortOrder = input.direction === "previous" ? lt : gt
  const compareId = input.direction === "previous" ? lt : gt
  return or(
    compareSortOrder(courses.sortOrder, cursorSortOrder),
    and(
      eq(courses.sortOrder, cursorSortOrder),
      compareId(courses.id, input.cursor)
    )
  )
}

function createReadCoursesWhereCondition({
  category,
  query,
  status,
}: {
  readonly category: string
  readonly query: string
  readonly status: ReadContentCoursesInput["status"]
}) {
  const statusCondition =
    status === "all" ? undefined : eq(courses.status, status)
  const categoryCondition =
    category.length === 0
      ? undefined
      : eq(courseCurriculumVersions.category, category)
  const titleCondition =
    query.length === 0
      ? undefined
      : sql`${courseCurriculumVersions.id} IN (
          SELECT document.curriculum_version_id
          FROM course_curriculum_version_title_fts
          INNER JOIN course_curriculum_version_title_search_documents AS document
            ON document.rowid = course_curriculum_version_title_fts.rowid
          WHERE course_curriculum_version_title_fts MATCH ${createFts5Phrase(query)}
        )`

  return and(statusCondition, categoryCondition, titleCondition)
}

function readNextCourseSortOrder(database: CourseReadDatabase): number {
  return (
    database
      .select({
        value: sql<number>`COALESCE(MAX(${courses.sortOrder}), 0) + 1`,
      })
      .from(courses)
      .get()?.value ?? 1
  )
}

export function toCourseEditorDocument(
  draft: CurriculumDraft
): CourseEditorDocument {
  const { visualKey: _visualKey, ...document } = draft
  return { ...document, assets: [] }
}
