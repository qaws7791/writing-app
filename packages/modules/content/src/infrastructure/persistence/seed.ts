import { eq } from "drizzle-orm"
import type { WritingAppDatabase } from "@workspace/db/client"

import {
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

type WritingAppDatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

const defaultSeedTime = new Date("2026-06-14T00:00:00.000Z")

export async function seedContentDatabase(
  database: WritingAppDatabase
): Promise<void> {
  const rows = await createDefaultContentSeedRows()
  database.transaction((transaction) => {
    insertMissingContentSeedAggregates(transaction, rows, defaultSeedTime)
  })
}

function insertMissingContentSeedAggregates(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows,
  now: Date
): void {
  for (const course of rows.courses) {
    const existingCourse = transaction
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, course.id))
      .get()

    if (existingCourse === undefined) {
      insertSeedCourse(transaction, rows, course, now)
    }
  }
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
