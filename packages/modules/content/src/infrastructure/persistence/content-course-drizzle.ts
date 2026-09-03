import { and, asc, count, eq, like, sql } from "drizzle-orm"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { WritingAppDatabase } from "@workspace/db/client"
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

export function insertCourse(
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
        eq(courseCurriculumVersions.status, "draft")
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
  const category = input.category.trim()
  const whereCondition = createReadCoursesWhereCondition({
    category,
    query: input.query.trim(),
    status: input.status,
  })
  const totalItems =
    database
      .select({ value: count() })
      .from(courses)
      .innerJoin(
        courseCurriculumVersions,
        and(
          eq(courseCurriculumVersions.courseId, courses.id),
          eq(courseCurriculumVersions.status, "draft")
        )
      )
      .where(whereCondition)
      .get()?.value ?? 0
  const pagination = createPageBounds(input, totalItems)
  const unitCountExpression = sql<number>`count(distinct ${courseUnitVersions.id})`
  const lessonCountExpression = sql<number>`count(distinct ${lessonVersions.id})`
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
        eq(courseCurriculumVersions.status, "draft")
      )
    )
    .leftJoin(
      courseUnitVersions,
      and(
        eq(courseUnitVersions.curriculumVersionId, courseCurriculumVersions.id),
        eq(courseUnitVersions.status, activeStatus)
      )
    )
    .leftJoin(
      lessonVersions,
      and(
        eq(lessonVersions.curriculumVersionId, courseCurriculumVersions.id),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .where(whereCondition)
    .groupBy(courses.id, courseCurriculumVersions.id)
    .orderBy(asc(courses.sortOrder))
    .limit(pagination.pageSize)
    .offset(pagination.offset)
    .all()

  return {
    items: rows.map(({ coverAssetId, ...row }) => ({
      ...row,
      coverAssetId:
        coverAssetId === null ? null : (coverAssetId as ContentAssetId),
      id: createCourseId(row.id),
      visualKey: readCourseVisualKey(row.visualKey),
    })),
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  }
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
      : like(courseCurriculumVersions.title, `%${escapeLikePattern(query)}%`)

  return and(statusCondition, categoryCondition, titleCondition)
}

/** `LIKE` 와일드카드를 포함한 검색어가 조건을 넓히지 않도록 escape한다. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/gu, (match) => `\\${match}`)
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

function createPageBounds(
  input: { readonly page: number; readonly pageSize: number },
  totalItems: number
) {
  const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize))
  const page = Math.min(input.page, totalPages)
  return {
    offset: (page - 1) * input.pageSize,
    page,
    pageSize: input.pageSize,
    totalItems,
    totalPages,
  }
}

export function toCourseEditorDocument(
  draft: CurriculumDraft
): CourseEditorDocument {
  const { visualKey: _visualKey, ...document } = draft
  return { ...document, assets: [] }
}
