import { and, asc, count, eq, or, sql } from "drizzle-orm"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  CourseId,
  CurriculumVersionId,
  LessonId,
} from "@workspace/types/ids"

import type { ContentError } from "#content/domain/content-error"
import {
  contentStatuses,
  createCourseId,
  createCurriculumVersionId,
  readCourseVisualKey,
  readCurriculumVersionId,
  readLessonId,
  readLessonStepId,
  readLessonStepType,
  readUnitId,
  type Course,
  type CurriculumDraft,
  type CurriculumLesson,
  type CurriculumStep,
  type CurriculumUnit,
  type PublishedCourseSummary,
  type PublishedCurriculumRevision,
  type PublishedLessonReference,
} from "#content/domain/content-model"
import { createCurriculumDraft } from "#content/domain/curriculum"
import type {
  ContentCoursePage,
  ContentRepository,
  CourseEditorDocument,
  ReadContentCoursesInput,
} from "#content/application/ports/content-ports"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "#content/infrastructure/persistence/schema"
import { resetContentFromSeed } from "#content/infrastructure/persistence/seed"

const activeStatus = contentStatuses.active

type WritingAppDatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]
type CourseReadDatabase = Pick<WritingAppDatabase, "select">

export function createDrizzleContentRepository(
  database: WritingAppDatabase
): ContentRepository {
  return Object.freeze({
    async createCourse(input) {
      return createCourse(database, input)
    },
    async findCourse(courseId) {
      return findCourse(database, courseId)
    },
    async findCurriculumByLesson(input) {
      return findCurriculumByLesson(database, input)
    },
    async findDraft(courseId) {
      return readDraft(database, courseId)
    },
    async listPublishedCourseSummaries() {
      return listPublishedCourseSummaries(database)
    },
    async publishDraft(input) {
      return publishDraft(database, input)
    },
    async readCourseEditor(courseId) {
      const draft = readDraft(database, courseId)
      if (draft.isErr()) {
        throw new Error(`Content draft invariant failed: ${draft.error.kind}`)
      }
      return draft.value === null ? null : toCourseEditorDocument(draft.value)
    },
    async readCourses(input) {
      return readCourses(database, input)
    },
    async readCurriculum(input) {
      return readCurriculum(database, input)
    },
    async resetContent(input) {
      return ok(await resetContentFromSeed(database, input.now))
    },
    async saveCourse(input) {
      return saveCourse(database, input)
    },
    async saveDraft(input) {
      return saveDraft(database, input)
    },
  })
}

function createCourse(
  database: WritingAppDatabase,
  input: { readonly courseId: CourseId; readonly now: Date }
): Result<CourseEditorDocument, ContentError> {
  const curriculumVersionId = createCurriculumVersionId(input.courseId, 1)
  const sortOrder = readNextCourseSortOrder(database)

  try {
    database.transaction((transaction) => {
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
          category: "미분류",
          courseId: input.courseId,
          createdAt: input.now,
          description: "강의 설명을 입력하세요.",
          editVersion: 0,
          id: curriculumVersionId,
          publishedAt: null,
          revision: 1,
          status: "draft",
          title: "새 강의",
          updatedAt: input.now,
          visualKey: "basic-sentence-writing",
        })
        .run()
    })
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      return err({ kind: "content-conflict" })
    }
    throw error
  }

  return ok(
    Object.freeze({
      category: "미분류",
      courseId: input.courseId,
      curriculumVersionId,
      description: "강의 설명을 입력하세요.",
      editVersion: 0,
      revision: 1,
      title: "새 강의",
      units: Object.freeze([]),
    })
  )
}

function findCourse(
  database: CourseReadDatabase,
  courseId: CourseId
): Course | null {
  const row = database
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .get()
  if (row === undefined) return null

  return Object.freeze({
    createdAt: new Date(row.createdAt),
    id: createCourseId(row.id),
    publishedCurriculumVersionId:
      row.publishedCurriculumVersionId === null
        ? null
        : readCurriculumVersionId(row.publishedCurriculumVersionId),
    sortOrder: row.sortOrder,
    status: row.status,
  })
}

function readDraft(
  database: CourseReadDatabase,
  courseId: CourseId
): Result<CurriculumDraft | null, ContentError> {
  const rows = database
    .select({
      category: courseCurriculumVersions.category,
      courseId: courses.id,
      courseStatus: courses.status,
      curriculumVersionId: courseCurriculumVersions.id,
      description: courseCurriculumVersions.description,
      editVersion: courseCurriculumVersions.editVersion,
      revision: courseCurriculumVersions.revision,
      title: courseCurriculumVersions.title,
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
    .where(eq(courses.id, courseId))
    .all()

  if (rows.length > 1) return err({ kind: "content-conflict" })
  const row = rows[0]
  if (row === undefined || row.courseStatus !== activeStatus) return ok(null)

  return createCurriculumDraft({
    category: row.category,
    courseId: createCourseId(row.courseId),
    curriculumVersionId: readCurriculumVersionId(row.curriculumVersionId),
    description: row.description,
    editVersion: row.editVersion,
    revision: row.revision,
    title: row.title,
    units: readCurriculumUnits(database, row.curriculumVersionId),
    visualKey: readCourseVisualKey(row.visualKey),
  })
}

function readCurriculumUnits(
  database: CourseReadDatabase,
  curriculumVersionId: string
): readonly CurriculumUnit[] {
  const unitRows = database
    .select()
    .from(courseUnitVersions)
    .where(
      and(
        eq(courseUnitVersions.curriculumVersionId, curriculumVersionId),
        eq(courseUnitVersions.status, activeStatus)
      )
    )
    .orderBy(asc(courseUnitVersions.sortOrder))
    .all()
  const lessonRows = database
    .select()
    .from(lessonVersions)
    .where(
      and(
        eq(lessonVersions.curriculumVersionId, curriculumVersionId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonVersions.sortOrder))
    .all()
  const stepRows = database
    .select()
    .from(lessonStepVersions)
    .where(
      and(
        eq(lessonStepVersions.curriculumVersionId, curriculumVersionId),
        eq(lessonStepVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonStepVersions.sortOrder))
    .all()

  return Object.freeze(
    unitRows.map((unit) =>
      Object.freeze({
        id: readUnitId(unit.id),
        lessons: Object.freeze(
          lessonRows
            .filter((lesson) => lesson.unitId === unit.id)
            .map((lesson) => toCurriculumLesson(lesson, stepRows))
        ),
        sortOrder: unit.sortOrder,
        status: unit.status,
        title: unit.title,
      })
    )
  )
}

function toCurriculumLesson(
  lesson: typeof lessonVersions.$inferSelect,
  steps: readonly (typeof lessonStepVersions.$inferSelect)[]
): CurriculumLesson {
  return Object.freeze({
    category: lesson.category,
    description: lesson.description,
    estimatedMinutes: lesson.estimatedMinutes,
    id: readLessonId(lesson.id),
    sortOrder: lesson.sortOrder,
    status: lesson.status,
    steps: Object.freeze(
      steps.filter((step) => step.lessonId === lesson.id).map(toCurriculumStep)
    ),
    summary: Object.freeze(readJsonStringArray(lesson.summaryJson)),
    title: lesson.title,
  })
}

function toCurriculumStep(
  step: typeof lessonStepVersions.$inferSelect
): CurriculumStep {
  const type = readLessonStepType(step.type)
  if (type === null) throw new Error(`Invalid persisted step type: ${step.id}`)

  return Object.freeze({
    contentJson: step.contentJson,
    id: readLessonStepId(step.id),
    sortOrder: step.sortOrder,
    status: step.status,
    type,
  })
}

function saveDraft(
  database: WritingAppDatabase,
  input: {
    readonly draft: CurriculumDraft
    readonly expectedEditVersion: number
    readonly now: Date
  }
): Result<CurriculumDraft, ContentError> {
  return database.transaction((transaction) => {
    const currentDraft = transaction
      .select({
        courseStatus: courses.status,
        editVersion: courseCurriculumVersions.editVersion,
        id: courseCurriculumVersions.id,
        status: courseCurriculumVersions.status,
      })
      .from(courses)
      .innerJoin(
        courseCurriculumVersions,
        eq(courseCurriculumVersions.courseId, courses.id)
      )
      .where(
        and(
          eq(courses.id, input.draft.courseId),
          eq(courseCurriculumVersions.id, input.draft.curriculumVersionId)
        )
      )
      .get()

    if (
      currentDraft === undefined ||
      currentDraft.courseStatus !== activeStatus
    ) {
      return err({ kind: "content-not-found" })
    }
    if (currentDraft.status === "published") {
      return err({ kind: "content-immutable-revision" })
    }
    if (
      currentDraft.editVersion !== input.expectedEditVersion ||
      input.draft.editVersion !== input.expectedEditVersion
    ) {
      return err({ kind: "content-conflict" })
    }

    const updatedDraft = transaction
      .update(courseCurriculumVersions)
      .set({
        category: input.draft.category,
        description: input.draft.description,
        editVersion: input.expectedEditVersion + 1,
        title: input.draft.title,
        updatedAt: input.now,
      })
      .where(
        and(
          eq(courseCurriculumVersions.id, currentDraft.id),
          eq(courseCurriculumVersions.editVersion, input.expectedEditVersion),
          eq(courseCurriculumVersions.status, "draft")
        )
      )
      .returning({ id: courseCurriculumVersions.id })
      .get()
    if (updatedDraft === undefined) return err({ kind: "content-conflict" })

    deleteDraftContent(transaction, currentDraft.id)
    insertCurriculumContent(transaction, currentDraft.id, input.draft.units)

    const saved = readDraft(transaction, input.draft.courseId)
    if (saved.isErr()) return err(saved.error)
    if (saved.value === null) {
      throw new Error("Saved content draft was not found")
    }
    return ok(saved.value)
  })
}

function publishDraft(
  database: WritingAppDatabase,
  input: Parameters<ContentRepository["publishDraft"]>[0]
): Result<PublishedCurriculumRevision, ContentError> {
  return database.transaction((transaction) => {
    const publishedRevision = input.decision.aggregate
    const published = transaction
      .update(courseCurriculumVersions)
      .set({
        publishedAt: publishedRevision.publishedAt,
        status: "published",
        updatedAt: publishedRevision.publishedAt,
      })
      .where(
        and(
          eq(
            courseCurriculumVersions.id,
            publishedRevision.curriculumVersionId
          ),
          eq(courseCurriculumVersions.editVersion, input.expectedEditVersion),
          eq(courseCurriculumVersions.status, "draft")
        )
      )
      .returning({ id: courseCurriculumVersions.id })
      .get()
    if (published === undefined) return err({ kind: "content-conflict" })

    transaction
      .update(courses)
      .set({
        publishedCurriculumVersionId: publishedRevision.curriculumVersionId,
      })
      .where(eq(courses.id, publishedRevision.courseId))
      .run()

    const nextRevision = publishedRevision.revision + 1
    transaction
      .insert(courseCurriculumVersions)
      .values({
        category: publishedRevision.category,
        courseId: publishedRevision.courseId,
        createdAt: publishedRevision.publishedAt,
        description: publishedRevision.description,
        editVersion: 0,
        id: input.nextDraftId,
        publishedAt: null,
        revision: nextRevision,
        status: "draft",
        title: publishedRevision.title,
        updatedAt: publishedRevision.publishedAt,
        visualKey: publishedRevision.visualKey,
      })
      .run()
    insertCurriculumContent(
      transaction,
      input.nextDraftId,
      publishedRevision.units
    )

    return ok(publishedRevision)
  })
}

function insertCurriculumContent(
  transaction: WritingAppDatabaseTransaction,
  curriculumVersionId: string,
  units: readonly CurriculumUnit[]
): void {
  const unitRows = units.map(({ lessons: _lessons, ...unit }) => ({
    ...unit,
    curriculumVersionId,
  }))
  const lessonRows = units.flatMap((unit) =>
    unit.lessons.map(({ steps: _steps, summary, ...lesson }) => ({
      ...lesson,
      curriculumVersionId,
      summaryJson: JSON.stringify(summary),
      unitId: unit.id,
    }))
  )
  const stepRows = units.flatMap((unit) =>
    unit.lessons.flatMap((lesson) =>
      lesson.steps.map((step) => ({
        ...step,
        curriculumVersionId,
        lessonId: lesson.id,
      }))
    )
  )

  if (unitRows.length > 0) {
    transaction.insert(courseUnitVersions).values(unitRows).run()
  }
  if (lessonRows.length > 0) {
    transaction.insert(lessonVersions).values(lessonRows).run()
  }
  if (stepRows.length > 0) {
    transaction.insert(lessonStepVersions).values(stepRows).run()
  }
}

function deleteDraftContent(
  transaction: WritingAppDatabaseTransaction,
  curriculumVersionId: string
): void {
  transaction
    .delete(lessonStepVersions)
    .where(eq(lessonStepVersions.curriculumVersionId, curriculumVersionId))
    .run()
  transaction
    .delete(lessonVersions)
    .where(eq(lessonVersions.curriculumVersionId, curriculumVersionId))
    .run()
  transaction
    .delete(courseUnitVersions)
    .where(eq(courseUnitVersions.curriculumVersionId, curriculumVersionId))
    .run()
}

function saveCourse(
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

function readCourses(
  database: WritingAppDatabase,
  input: ReadContentCoursesInput
): ContentCoursePage {
  const query = input.query.trim().toLowerCase()
  const category = input.category.trim()
  const whereCondition = createReadCoursesWhereCondition({
    category,
    query,
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

  return Object.freeze({
    items: Object.freeze(
      rows.map((row) =>
        Object.freeze({
          ...row,
          id: createCourseId(row.id),
          visualKey: readCourseVisualKey(row.visualKey),
        })
      )
    ),
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  })
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
  const queryCondition =
    query.length === 0
      ? undefined
      : or(
          sql`lower(${courseCurriculumVersions.title}) like ${`%${query}%`}`,
          sql`lower(${courseCurriculumVersions.description}) like ${`%${query}%`}`
        )

  return and(statusCondition, categoryCondition, queryCondition)
}

function listPublishedCourseSummaries(
  database: CourseReadDatabase
): readonly PublishedCourseSummary[] {
  const rows = database
    .select({
      category: courseCurriculumVersions.category,
      courseId: courses.id,
      description: courseCurriculumVersions.description,
      lessonCount: count(lessonVersions.id),
      revision: courseCurriculumVersions.revision,
      sortOrder: courses.sortOrder,
      title: courseCurriculumVersions.title,
      versionId: courseCurriculumVersions.id,
      visualKey: courseCurriculumVersions.visualKey,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
    )
    .leftJoin(
      lessonVersions,
      and(
        eq(lessonVersions.curriculumVersionId, courseCurriculumVersions.id),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .where(eq(courses.status, activeStatus))
    .groupBy(courses.id, courseCurriculumVersions.id)
    .orderBy(asc(courses.sortOrder), asc(courses.id))
    .all()

  return Object.freeze(
    rows.map((row) =>
      Object.freeze({
        ...row,
        courseId: createCourseId(row.courseId),
        versionId: readCurriculumVersionId(row.versionId),
        visualKey: readCourseVisualKey(row.visualKey),
      })
    )
  )
}

function readCurriculum(
  database: CourseReadDatabase,
  input: {
    readonly courseId: CourseId
    readonly curriculumVersionId?: CurriculumVersionId
  }
): PublishedCurriculumRevision | null {
  const course = database
    .select()
    .from(courses)
    .where(eq(courses.id, input.courseId))
    .get()
  if (course === undefined) return null
  if (
    input.curriculumVersionId === undefined &&
    course.status !== activeStatus
  ) {
    return null
  }

  const versionId =
    input.curriculumVersionId ?? course.publishedCurriculumVersionId
  if (versionId === null) return null
  const version = database
    .select()
    .from(courseCurriculumVersions)
    .where(
      and(
        eq(courseCurriculumVersions.id, versionId),
        eq(courseCurriculumVersions.courseId, input.courseId),
        eq(courseCurriculumVersions.status, "published")
      )
    )
    .get()
  if (version === undefined || version.publishedAt === null) return null

  return Object.freeze({
    category: version.category,
    courseId: createCourseId(version.courseId),
    curriculumVersionId: readCurriculumVersionId(version.id),
    description: version.description,
    publishedAt: new Date(version.publishedAt),
    revision: version.revision,
    title: version.title,
    units: readCurriculumUnits(database, version.id),
    visualKey: readCourseVisualKey(version.visualKey),
  })
}

function findCurriculumByLesson(
  database: CourseReadDatabase,
  input: {
    readonly curriculumVersionId?: CurriculumVersionId
    readonly lessonId: LessonId
  }
): PublishedLessonReference | null {
  const versionCondition =
    input.curriculumVersionId === undefined
      ? and(
          eq(courseCurriculumVersions.courseId, courses.id),
          eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
        )
      : and(
          eq(courseCurriculumVersions.courseId, courses.id),
          eq(courseCurriculumVersions.id, input.curriculumVersionId)
        )
  const row = database
    .select({
      courseId: courses.id,
      curriculumVersionId: courseCurriculumVersions.id,
      lessonId: lessonVersions.id,
      revision: courseCurriculumVersions.revision,
    })
    .from(courses)
    .innerJoin(courseCurriculumVersions, versionCondition)
    .innerJoin(
      lessonVersions,
      and(
        eq(lessonVersions.curriculumVersionId, courseCurriculumVersions.id),
        eq(lessonVersions.id, input.lessonId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .where(
      and(
        eq(courseCurriculumVersions.status, "published"),
        input.curriculumVersionId === undefined
          ? eq(courses.status, activeStatus)
          : undefined
      )
    )
    .get()

  return row === undefined
    ? null
    : Object.freeze({
        courseId: createCourseId(row.courseId),
        curriculumVersionId: readCurriculumVersionId(row.curriculumVersionId),
        lessonId: readLessonId(row.lessonId),
        revision: row.revision,
      })
}

function readNextCourseSortOrder(database: WritingAppDatabase): number {
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

function toCourseEditorDocument(draft: CurriculumDraft): CourseEditorDocument {
  const { visualKey: _visualKey, ...document } = draft
  return Object.freeze(document)
}

function readJsonStringArray(value: string): readonly string[] {
  const parsed: unknown = JSON.parse(value)
  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === "string")
  ) {
    throw new Error("Invalid persisted lesson summary")
  }
  return parsed
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes("UNIQUE constraint failed")
  )
}
