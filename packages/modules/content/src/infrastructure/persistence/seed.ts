import { and, eq, sql } from "drizzle-orm"
import type { WritingAppDatabase } from "@workspace/db/client"

import {
  contentStatuses,
  createCourseId,
  createCurriculumVersionId,
} from "#content/domain/content-model"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "#content/infrastructure/persistence/schema"
import {
  createDefaultContentSeedRows,
  type ContentSeedRows,
  type CourseSeedRow,
} from "#content/infrastructure/persistence/content-seed"
import type { ContentResetResult } from "#content/application/ports/content-ports"

type WritingAppDatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

const defaultSeedTime = new Date("2026-06-14T00:00:00.000Z")

export async function seedContentDatabase(
  database: WritingAppDatabase
): Promise<void> {
  const rows = await createDefaultContentSeedRows()
  database.transaction((transaction) => {
    upsertContentSeedRows(transaction, rows, defaultSeedTime)
  })
}

export async function resetContentFromSeed(
  database: WritingAppDatabase,
  now: Date
): Promise<ContentResetResult> {
  const rows = await createDefaultContentSeedRows()

  return database.transaction((transaction) => {
    const archived = archiveContentRowsOutsideSeed(transaction, rows)
    upsertContentSeedRows(transaction, rows, now, false)

    const revision =
      transaction
        .select({
          value: sql<number>`COALESCE(MAX(${courseCurriculumVersions.revision}), 0)`,
        })
        .from(courseCurriculumVersions)
        .get()?.value ?? 0

    return Object.freeze({
      changed: Object.freeze({
        archived,
        courses: rows.courses.length,
        lessons: rows.lessons.length,
        steps: rows.steps.length,
        units: rows.units.length,
      }),
      revision,
    })
  })
}

export function upsertContentSeedRows(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows,
  now: Date,
  archiveMissing = true
): void {
  if (archiveMissing) archiveContentRowsOutsideSeed(transaction, rows)

  for (const course of rows.courses) {
    const existingCourse = transaction
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, course.id))
      .get()

    if (existingCourse === undefined) {
      insertSeedCourse(transaction, rows, course, now)
    } else {
      replaceSeedDraft(transaction, rows, course, now)
    }
  }
}

function archiveContentRowsOutsideSeed(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows
): number {
  const activeCourseIds = rows.courses.map((row) => row.id)
  const whereCondition =
    activeCourseIds.length === 0
      ? sql`${sql.identifier("status")} != ${contentStatuses.archived}`
      : sql`${sql.identifier("status")} != ${contentStatuses.archived} AND ${sql.identifier("id")} NOT IN (${sql.join(
          activeCourseIds.map((id) => sql`${id}`),
          sql`, `
        )})`

  transaction.run(
    sql`UPDATE ${sql.identifier("courses")} SET ${sql.identifier("status")} = ${contentStatuses.archived} WHERE ${whereCondition}`
  )

  return (
    transaction
      .select({ value: sql<number>`changes()` })
      .from(sql`(SELECT 1)`)
      .get()?.value ?? 0
  )
}

function insertSeedCourse(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows,
  course: CourseSeedRow,
  now: Date
): void {
  const courseId = createCourseId(course.id)
  const publishedVersionId = createCurriculumVersionId(courseId, 1)
  const draftVersionId = createCurriculumVersionId(courseId, 2)

  transaction
    .insert(courses)
    .values({
      createdAt: now,
      id: courseId,
      publishedCurriculumVersionId: null,
      sortOrder: course.sortOrder,
      status: course.status,
    })
    .run()
  insertCurriculumVersion(transaction, course, {
    createdAt: now,
    id: publishedVersionId,
    revision: 1,
  })
  insertVersionContent(transaction, rows, course.id, publishedVersionId)
  transaction
    .update(courseCurriculumVersions)
    .set({ publishedAt: now, status: "published", updatedAt: now })
    .where(eq(courseCurriculumVersions.id, publishedVersionId))
    .run()
  transaction
    .update(courses)
    .set({ publishedCurriculumVersionId: publishedVersionId })
    .where(eq(courses.id, courseId))
    .run()

  insertCurriculumVersion(transaction, course, {
    createdAt: now,
    id: draftVersionId,
    revision: 2,
  })
  insertVersionContent(transaction, rows, course.id, draftVersionId)
}

function replaceSeedDraft(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows,
  course: CourseSeedRow,
  now: Date
): void {
  transaction
    .update(courses)
    .set({ sortOrder: course.sortOrder, status: course.status })
    .where(eq(courses.id, course.id))
    .run()

  const existingDraft = transaction
    .select()
    .from(courseCurriculumVersions)
    .where(
      and(
        eq(courseCurriculumVersions.courseId, course.id),
        eq(courseCurriculumVersions.status, "draft")
      )
    )
    .get()

  if (existingDraft === undefined) {
    const nextRevision =
      transaction
        .select({
          value: sql<number>`COALESCE(MAX(${courseCurriculumVersions.revision}), 0) + 1`,
        })
        .from(courseCurriculumVersions)
        .where(eq(courseCurriculumVersions.courseId, course.id))
        .get()?.value ?? 1
    const draftVersionId = createCurriculumVersionId(
      createCourseId(course.id),
      nextRevision
    )
    insertCurriculumVersion(transaction, course, {
      createdAt: now,
      id: draftVersionId,
      revision: nextRevision,
    })
    insertVersionContent(transaction, rows, course.id, draftVersionId)
    return
  }

  deleteVersionContent(transaction, existingDraft.id)
  transaction
    .update(courseCurriculumVersions)
    .set({
      category: course.category,
      description: course.description,
      editVersion: existingDraft.editVersion + 1,
      title: course.title,
      updatedAt: now,
      visualKey: course.visualKey,
    })
    .where(eq(courseCurriculumVersions.id, existingDraft.id))
    .run()
  insertVersionContent(transaction, rows, course.id, existingDraft.id)
}

function insertCurriculumVersion(
  transaction: WritingAppDatabaseTransaction,
  course: CourseSeedRow,
  input: {
    readonly createdAt: Date
    readonly id: string
    readonly revision: number
  }
): void {
  transaction
    .insert(courseCurriculumVersions)
    .values({
      category: course.category,
      courseId: course.id,
      createdAt: input.createdAt,
      description: course.description,
      editVersion: 0,
      id: input.id,
      publishedAt: null,
      revision: input.revision,
      status: "draft",
      title: course.title,
      updatedAt: input.createdAt,
      visualKey: course.visualKey,
    })
    .run()
}

function insertVersionContent(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows,
  courseId: string,
  curriculumVersionId: string
): void {
  const units = rows.units.filter((unit) => unit.courseId === courseId)
  const lessons = rows.lessons.filter((lesson) => lesson.courseId === courseId)
  const lessonIds = new Set(lessons.map((lesson) => lesson.id))
  const steps = rows.steps.filter((step) => lessonIds.has(step.lessonId))

  if (units.length > 0) {
    transaction
      .insert(courseUnitVersions)
      .values(units.map((unit) => ({ ...unit, curriculumVersionId })))
      .run()
  }
  if (lessons.length > 0) {
    transaction
      .insert(lessonVersions)
      .values(
        lessons.map(({ courseId: _courseId, ...lesson }) => ({
          ...lesson,
          curriculumVersionId,
        }))
      )
      .run()
  }
  if (steps.length > 0) {
    transaction
      .insert(lessonStepVersions)
      .values(steps.map((step) => ({ ...step, curriculumVersionId })))
      .run()
  }
}

function deleteVersionContent(
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

export {
  createContentSeedRows,
  createDefaultContentSeedRows,
  readContentSeedData,
  toLessonStepSeedRows,
  type ContentSeedRows,
} from "#content/infrastructure/persistence/content-seed"
