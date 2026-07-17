import { and, asc, count, eq, or, sql } from "drizzle-orm"

import { createAdminPageBounds } from "@workspace/core/admin"
import type {
  ArchiveAdminCourseInput,
  ArchiveAdminCoursePersistenceResult,
  ContentResetRepository,
  CourseAdminRepository,
  CreateAdminCourseInput,
  PublishAdminCourseInput,
  PublishAdminCoursePersistenceResult,
  ReadAdminCourseInput,
  ReadAdminCoursesInput,
  ReadAdminCoursesResult,
  ResetAdminContentInput,
  SaveAdminCourseEditorInput,
  SaveAdminCourseEditorPersistenceResult,
} from "@workspace/core/content"
import {
  createDefaultAdminCourseContentIds,
  type CreateAdminCourseContentIds,
} from "@/adapters/content/admin-content-ids"
import { contentStatuses } from "@workspace/contracts/status"

import {
  adminCourseEditorDocumentSchema,
  type AdminContentResetResultDto,
  type AdminCourseDetailDto,
  type AdminCourseEditorDocument,
} from "@workspace/contracts/admin/content-data"
import {
  courseVisualKeySchema,
  type CourseVisualKey,
} from "@workspace/contracts/content"
import type { WritingAppDatabase } from "@workspace/db/client"
import { createCurriculumVersionId } from "@workspace/db/content/curriculum-version-id"
import { normalizeVersionedStepContent } from "@workspace/db/content/normalize-versioned-step-content"
import { persistedContentStatuses } from "@workspace/db/persisted-values"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/db/schema"
import { createDefaultContentSeedRows } from "@workspace/db/seeds/seed-content"
import { upsertContentSeedRows } from "@workspace/db/seeds/seed"

const createCourseCollisionRetryLimit = 3
const activeStatus = contentStatuses.active

type WritingAppDatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]
type CourseReadDatabase = Pick<WritingAppDatabase, "select">
type LessonStepVersionRow = typeof lessonStepVersions.$inferSelect

export type DrizzleAdminRepositoryDependencies = {
  readonly createCourseContentIds?: CreateAdminCourseContentIds
}

export function createAdminCourseRepository(
  db: WritingAppDatabase,
  dependencies: DrizzleAdminRepositoryDependencies = {}
): CourseAdminRepository & ContentResetRepository {
  const createCourseContentIds =
    dependencies.createCourseContentIds ?? createDefaultAdminCourseContentIds

  return {
    archiveCourse(input) {
      return Promise.resolve(archiveCourse(db, input))
    },
    createCourse(input) {
      return Promise.resolve(createCourse(db, input, createCourseContentIds))
    },
    publishCourse(input) {
      return Promise.resolve(publishCourse(db, input))
    },
    readCourseEditor(input) {
      return Promise.resolve(readCourseEditor(db, input))
    },
    readCourses(input) {
      return Promise.resolve(readCourses(db, input))
    },
    resetContent(input) {
      return resetContent(db, input)
    },
    saveCourseEditor(input) {
      return Promise.resolve(saveCourseEditor(db, input))
    },
  }
}

function createCourse(
  db: WritingAppDatabase,
  input: CreateAdminCourseInput,
  createContentIds: CreateAdminCourseContentIds
): AdminCourseDetailDto {
  for (let attempt = 1; attempt <= createCourseCollisionRetryLimit; attempt++) {
    const { courseId } = createContentIds()

    try {
      return insertCourseDraft(db, input, courseId)
    } catch (error) {
      if (
        attempt === createCourseCollisionRetryLimit ||
        !isCourseIdCollision(error)
      ) {
        throw error
      }
    }
  }

  throw new Error("Course ID generation retry limit was exceeded")
}

function insertCourseDraft(
  db: WritingAppDatabase,
  input: CreateAdminCourseInput,
  courseId: string
): AdminCourseDetailDto {
  const curriculumVersionId = createCurriculumVersionId(courseId, 1)
  const sortOrder = readNextCourseSortOrder(db)

  db.transaction((transaction) => {
    transaction
      .insert(courses)
      .values({
        createdAt: input.now,
        id: courseId,
        publishedCurriculumVersionId: null,
        sortOrder,
        status: activeStatus,
      })
      .run()
    transaction
      .insert(courseCurriculumVersions)
      .values({
        category: "미분류",
        courseId,
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

  return {
    category: "미분류",
    curriculumVersionId,
    description: "강의 설명을 입력하세요.",
    editVersion: 0,
    id: courseId,
    revision: 1,
    status: activeStatus,
    title: "새 강의",
    units: [],
  }
}

function isCourseIdCollision(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("UNIQUE constraint failed") &&
    (error.message.includes("courses.id") ||
      error.message.includes("course_curriculum_versions.id"))
  )
}

function readCourseEditor(
  db: CourseReadDatabase,
  input: ReadAdminCourseInput
): AdminCourseEditorDocument | null {
  const course = db
    .select({
      category: courseCurriculumVersions.category,
      curriculumVersionId: courseCurriculumVersions.id,
      description: courseCurriculumVersions.description,
      editVersion: courseCurriculumVersions.editVersion,
      id: courses.id,
      revision: courseCurriculumVersions.revision,
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
    .where(eq(courses.id, input.courseId))
    .get()

  if (course === undefined || course.status !== activeStatus) return null

  const units = db
    .select()
    .from(courseUnitVersions)
    .where(
      and(
        eq(courseUnitVersions.curriculumVersionId, course.curriculumVersionId),
        eq(courseUnitVersions.status, activeStatus)
      )
    )
    .orderBy(asc(courseUnitVersions.sortOrder))
    .all()
  const lessons = db
    .select()
    .from(lessonVersions)
    .where(
      and(
        eq(lessonVersions.curriculumVersionId, course.curriculumVersionId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonVersions.sortOrder))
    .all()
  const steps = db
    .select()
    .from(lessonStepVersions)
    .where(
      and(
        eq(lessonStepVersions.curriculumVersionId, course.curriculumVersionId),
        eq(lessonStepVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonStepVersions.sortOrder))
    .all()

  return adminCourseEditorDocumentSchema.parse({
    ...course,
    units: units.map((unit) => ({
      id: unit.id,
      lessons: lessons
        .filter((lesson) => lesson.unitId === unit.id)
        .map((lesson) => ({
          category: lesson.category,
          description: lesson.description,
          estimatedMinutes: lesson.estimatedMinutes,
          id: lesson.id,
          sortOrder: lesson.sortOrder,
          status: lesson.status,
          summary: readJsonStringArray(lesson.summaryJson),
          steps: steps
            .filter((step) => step.lessonId === lesson.id)
            .map(toEditorStep),
          title: lesson.title,
        })),
      sortOrder: unit.sortOrder,
      status: unit.status,
      title: unit.title,
    })),
  })
}

function toEditorStep(step: LessonStepVersionRow) {
  const parsedContent: unknown = JSON.parse(step.contentJson)
  if (!isJsonObject(parsedContent)) {
    throw new Error(`Invalid course editor step content: ${step.id}`)
  }
  const { type: _sourceType, ...content } = parsedContent
  return {
    ...content,
    id: step.id,
    sortOrder: step.sortOrder,
    status: step.status,
    type: step.type,
  }
}

function saveCourseEditor(
  db: WritingAppDatabase,
  input: SaveAdminCourseEditorInput
): SaveAdminCourseEditorPersistenceResult {
  return db.transaction((transaction) => {
    const currentDraft = transaction
      .select({
        courseStatus: courses.status,
        editVersion: courseCurriculumVersions.editVersion,
        id: courseCurriculumVersions.id,
      })
      .from(courses)
      .innerJoin(
        courseCurriculumVersions,
        and(
          eq(courseCurriculumVersions.courseId, courses.id),
          eq(courseCurriculumVersions.status, "draft")
        )
      )
      .where(eq(courses.id, input.courseId))
      .get()

    if (
      currentDraft === undefined ||
      currentDraft.courseStatus !== activeStatus
    ) {
      return { kind: "not-found" }
    }
    if (
      currentDraft.id !== input.document.curriculumVersionId ||
      input.document.id !== input.courseId
    ) {
      return { kind: "invalid-reference" }
    }
    if (
      currentDraft.editVersion !== input.expectedEditVersion ||
      input.document.editVersion !== input.expectedEditVersion
    ) {
      return { kind: "stale-revision" }
    }

    const updatedDraft = transaction
      .update(courseCurriculumVersions)
      .set({
        category: input.document.category,
        description: input.document.description,
        editVersion: input.expectedEditVersion + 1,
        title: input.document.title,
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

    if (updatedDraft === undefined) return { kind: "stale-revision" }

    deleteDraftContent(transaction, currentDraft.id)
    insertEditorContent(transaction, currentDraft.id, input.document)

    const value = readCourseEditor(transaction, { courseId: input.courseId })
    if (value === null) throw new Error("Saved course draft was not found")
    return { kind: "ok", value }
  })
}

function publishCourse(
  db: WritingAppDatabase,
  input: PublishAdminCourseInput
): PublishAdminCoursePersistenceResult {
  return db.transaction((transaction) => {
    const draft = readCourseEditor(transaction, { courseId: input.courseId })
    if (draft === null) return { kind: "not-found" }
    if (draft.editVersion !== input.expectedEditVersion) {
      return { kind: "stale-revision" }
    }
    if (!isPublishableDraft(draft)) return { kind: "invalid-draft" }

    const published = transaction
      .update(courseCurriculumVersions)
      .set({
        publishedAt: input.now,
        status: "published",
        updatedAt: input.now,
      })
      .where(
        and(
          eq(courseCurriculumVersions.id, draft.curriculumVersionId),
          eq(courseCurriculumVersions.editVersion, input.expectedEditVersion),
          eq(courseCurriculumVersions.status, "draft")
        )
      )
      .returning({ id: courseCurriculumVersions.id })
      .get()
    if (published === undefined) return { kind: "stale-revision" }

    transaction
      .update(courses)
      .set({ publishedCurriculumVersionId: draft.curriculumVersionId })
      .where(eq(courses.id, input.courseId))
      .run()

    const nextRevision = draft.revision + 1
    const nextDraftId = createCurriculumVersionId(input.courseId, nextRevision)
    transaction
      .insert(courseCurriculumVersions)
      .values({
        category: draft.category,
        courseId: input.courseId,
        createdAt: input.now,
        description: draft.description,
        editVersion: 0,
        id: nextDraftId,
        publishedAt: null,
        revision: nextRevision,
        status: "draft",
        title: draft.title,
        updatedAt: input.now,
        visualKey: readDraftVisualKey(transaction, draft.curriculumVersionId),
      })
      .run()
    insertEditorContent(transaction, nextDraftId, {
      ...draft,
      curriculumVersionId: nextDraftId,
      editVersion: 0,
      revision: nextRevision,
    })

    return {
      kind: "ok",
      value: {
        curriculumVersionId: draft.curriculumVersionId,
        publishedAt: input.now.toISOString(),
        revision: draft.revision,
      },
    }
  })
}

function insertEditorContent(
  transaction: WritingAppDatabaseTransaction,
  curriculumVersionId: string,
  document: AdminCourseEditorDocument
): void {
  const units = document.units.map(({ lessons: _lessons, ...unit }) => ({
    ...unit,
    curriculumVersionId,
  }))
  const lessons = document.units.flatMap((unit) =>
    unit.lessons.map(({ steps: _steps, summary, ...lesson }) => ({
      ...lesson,
      curriculumVersionId,
      summaryJson: JSON.stringify(summary),
      unitId: unit.id,
    }))
  )
  const steps = document.units.flatMap((unit) =>
    unit.lessons.flatMap((lesson) =>
      lesson.steps.map((step) => {
        const { id, sortOrder, status, type, ...content } = step
        return {
          contentJson: normalizeVersionedStepContent(
            id,
            type,
            JSON.stringify({
              ...content,
              type: type.toLocaleLowerCase("en-US"),
            })
          ),
          curriculumVersionId,
          id,
          lessonId: lesson.id,
          sortOrder,
          status,
          type,
        }
      })
    )
  )

  if (units.length > 0)
    transaction.insert(courseUnitVersions).values(units).run()
  if (lessons.length > 0)
    transaction.insert(lessonVersions).values(lessons).run()
  if (steps.length > 0)
    transaction.insert(lessonStepVersions).values(steps).run()
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

function isPublishableDraft(document: AdminCourseEditorDocument): boolean {
  if (document.units.length === 0) return false

  for (const unit of document.units) {
    if (unit.lessons.length === 0) return false
    for (const lesson of unit.lessons) {
      if (
        lesson.steps.length === 0 ||
        !hasValidSelectableItemIds(lesson.steps)
      ) {
        return false
      }
    }
  }
  return true
}

function hasValidSelectableItemIds(
  steps: AdminCourseEditorDocument["units"][number]["lessons"][number]["steps"]
): boolean {
  return steps.every((step) => {
    switch (step.type) {
      case "MULTIPLE_CHOICE": {
        const ids = step.options.map((option) => option.id)
        return hasUniqueIds(ids) && ids.includes(step.correct)
      }
      case "FILL_BLANK":
        return hasParallelUniqueIds(step.words, step.wordIds)
      case "SELECT":
        return hasParallelUniqueIds(step.segments, step.segmentIds)
      case "ORDER":
        return hasParallelUniqueIds(step.items, step.itemIds)
      case "MATCH":
        return hasUniqueIds(
          step.pairs.flatMap((pair) => [pair.leftId, pair.rightId])
        )
      case "CATEGORIZE": {
        const categoryIds = step.categories.map((category) => category.id)
        const itemIds = step.items.map((item) => item.id)
        return (
          hasUniqueIds(categoryIds) &&
          hasUniqueIds(itemIds) &&
          step.items.every((item) => categoryIds.includes(item.categoryId))
        )
      }
      default:
        return true
    }
  })
}

function hasParallelUniqueIds(
  items: readonly unknown[],
  ids: readonly string[] | undefined
): boolean {
  return ids !== undefined && ids.length === items.length && hasUniqueIds(ids)
}

function hasUniqueIds(ids: readonly (string | undefined)[]): boolean {
  return (
    ids.every((id): id is string => typeof id === "string" && id.length > 0) &&
    new Set(ids).size === ids.length
  )
}

function readDraftVisualKey(
  db: CourseReadDatabase,
  curriculumVersionId: string
): CourseVisualKey {
  const value = db
    .select({ visualKey: courseCurriculumVersions.visualKey })
    .from(courseCurriculumVersions)
    .where(eq(courseCurriculumVersions.id, curriculumVersionId))
    .get()?.visualKey
  return readCourseVisualKey(value ?? "basic-sentence-writing")
}

function readCourses(
  db: WritingAppDatabase,
  input: ReadAdminCoursesInput
): ReadAdminCoursesResult {
  const query = input.query.trim().toLowerCase()
  const category = input.category.trim()
  const whereCondition = createReadCoursesWhereCondition({
    category,
    query,
    status: input.status,
  })
  const totalItems =
    db
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
  const pagination = createAdminPageBounds(input, totalItems)
  const unitCountExpression = sql<number>`count(distinct ${courseUnitVersions.id})`
  const lessonCountExpression = sql<number>`count(distinct ${lessonVersions.id})`
  const rows = db
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

  return {
    items: rows.map((row) => ({
      ...row,
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
  readonly status: ReadAdminCoursesInput["status"]
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

function archiveCourse(
  db: WritingAppDatabase,
  input: ArchiveAdminCourseInput
): ArchiveAdminCoursePersistenceResult {
  void input.now
  const archived = db
    .update(courses)
    .set({ status: contentStatuses.archived })
    .where(
      and(
        eq(courses.id, input.courseId),
        eq(courses.status, contentStatuses.active)
      )
    )
    .returning({ id: courses.id })
    .get()

  return archived === undefined ? { kind: "not-found" } : { kind: "ok" }
}

function readNextCourseSortOrder(db: WritingAppDatabase): number {
  return (
    db
      .select({
        value: sql<number>`COALESCE(MAX(${courses.sortOrder}), 0) + 1`,
      })
      .from(courses)
      .get()?.value ?? 1
  )
}

async function resetContent(
  db: WritingAppDatabase,
  input: ResetAdminContentInput
): Promise<AdminContentResetResultDto> {
  const seedRows = await createDefaultContentSeedRows()

  return db.transaction((transaction) => {
    void input.now
    const seedCourseIds = new Set(seedRows.courses.map((course) => course.id))
    const archived = transaction
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.status, persistedContentStatuses.active))
      .all()
      .filter(({ id }) => !seedCourseIds.has(id)).length

    upsertContentSeedRows(transaction, seedRows)

    const revision =
      transaction
        .select({
          value: sql<number>`COALESCE(MAX(${courseCurriculumVersions.revision}), 0)`,
        })
        .from(courseCurriculumVersions)
        .get()?.value ?? 0

    return {
      changed: {
        archived,
        courses: seedRows.courses.length,
        lessons: seedRows.lessons.length,
        steps: seedRows.steps.length,
        units: seedRows.units.length,
      },
      revision,
    }
  })
}

function readCourseVisualKey(value: string): CourseVisualKey {
  const parsed = courseVisualKeySchema.safeParse(value)
  return parsed.success ? parsed.data : "basic-sentence-writing"
}

function readJsonStringArray(value: string): string[] {
  const parsed: unknown = JSON.parse(value)
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : []
}

function isJsonObject(value: unknown): value is { [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
