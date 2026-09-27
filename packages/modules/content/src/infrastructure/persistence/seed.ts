import { executeBatch, type DatabaseStatement } from "@workspace/db/batch"
import { eq } from "drizzle-orm"
import { chunkByBoundParameters } from "@workspace/db/bound-parameter-chunks"
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

type WritingAppDatabaseTransaction = WritingAppDatabase

const defaultSeedTime = new Date("2026-06-14T00:00:00.000Z")

export async function seedContentDatabase(
  database: WritingAppDatabase
): Promise<void> {
  const rows = await createDefaultContentSeedRows()
  await insertMissingContentSeedAggregates(database, rows, defaultSeedTime)
}

async function insertMissingContentSeedAggregates(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows,
  now: Date
): Promise<void> {
  for (const course of rows.courses) {
    const existingCourse = await transaction
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, course.id))
      .get()

    if (existingCourse === undefined) {
      await insertSeedCourse(transaction, rows, course, now)
    }
  }
}

async function insertSeedCourse(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows,
  course: CourseSeedRow,
  now: Date
): Promise<void> {
  const statements: DatabaseStatement[] = []
  const courseId = createCourseId(course.id)
  const publishedVersionId = createCurriculumVersionId(courseId, 1)
  const draftVersionId = createCurriculumVersionId(courseId, 2)

  statements.push(
    transaction.insert(courses).values({
      createdAt: now,
      id: courseId,
      publishedCurriculumVersionId: null,
      sortOrder: course.sortOrder,
      status: course.status,
    })
  )
  insertCurriculumVersion(transaction, statements, course, {
    createdAt: now,
    id: publishedVersionId,
    revision: 1,
  })
  insertVersionContent(
    transaction,
    statements,
    rows,
    course.id,
    publishedVersionId
  )
  statements.push(
    transaction
      .update(courseCurriculumVersions)
      .set({ publishedAt: now, status: "published", updatedAt: now })
      .where(eq(courseCurriculumVersions.id, publishedVersionId))
  )
  statements.push(
    transaction
      .update(courses)
      .set({ publishedCurriculumVersionId: publishedVersionId })
      .where(eq(courses.id, courseId))
  )

  insertCurriculumVersion(transaction, statements, course, {
    createdAt: now,
    id: draftVersionId,
    revision: 2,
  })
  insertVersionContent(transaction, statements, rows, course.id, draftVersionId)
  await executeBatch(transaction, statements)
}

function insertCurriculumVersion(
  transaction: WritingAppDatabaseTransaction,
  statements: DatabaseStatement[],
  course: CourseSeedRow,
  input: {
    readonly createdAt: Date
    readonly id: string
    readonly revision: number
  }
): void {
  statements.push(
    transaction.insert(courseCurriculumVersions).values({
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
  )
}

function insertVersionContent(
  transaction: WritingAppDatabaseTransaction,
  statements: DatabaseStatement[],
  rows: ContentSeedRows,
  courseId: string,
  curriculumVersionId: string
): void {
  const units = rows.units.filter((unit) => unit.courseId === courseId)
  const lessons = rows.lessons.filter((lesson) => lesson.courseId === courseId)
  const lessonIds = new Set(lessons.map((lesson) => lesson.id))
  const steps = rows.steps.filter((step) => lessonIds.has(step.lessonId))

  for (const unitChunk of chunkByBoundParameters(units, {
    fixedParameters: 0,
    parametersPerItem: 5,
  })) {
    statements.push(
      transaction
        .insert(courseUnitVersions)
        .values(unitChunk.map((unit) => ({ ...unit, curriculumVersionId })))
    )
  }
  for (const lessonChunk of chunkByBoundParameters(lessons, {
    fixedParameters: 0,
    parametersPerItem: 10,
  })) {
    statements.push(
      transaction.insert(lessonVersions).values(
        lessonChunk.map(({ courseId: _courseId, ...lesson }) => ({
          ...lesson,
          curriculumVersionId,
        }))
      )
    )
  }
  for (const stepChunk of chunkByBoundParameters(steps, {
    fixedParameters: 0,
    parametersPerItem: 7,
  })) {
    statements.push(
      transaction
        .insert(lessonStepVersions)
        .values(stepChunk.map((step) => ({ ...step, curriculumVersionId })))
    )
  }
}
