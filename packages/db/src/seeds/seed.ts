import { existsSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { and, eq, sql } from "drizzle-orm"

import { archiveContentRowsOutsideSeed } from "@workspace/db/content/content-archive-policy"
import { createCurriculumVersionId } from "@workspace/db/content/curriculum-version-id"
import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
  type WritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import {
  assertDestructiveDatabaseAllowed,
  inspectDatabaseResetTarget,
  resetSqliteDatabaseFiles,
} from "@workspace/db/destructive-operation-guard"
import {
  authUsers,
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  learnerProfiles,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/db/schema"
import {
  createDefaultContentSeedRows,
  type ContentSeedRows,
  type CourseSeedRow,
} from "@workspace/db/seeds/seed-content"
import { persistedLearnerAccountStatuses } from "@workspace/db/persisted-values"

type WritingAppDatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

export type SeedDatabaseOptions = {
  readonly allowDatabaseReset?: boolean
  readonly databaseUrl?: string
  readonly forceDatabaseReset?: boolean
  readonly nodeEnv?: string
  readonly targetFingerprint?: string
}

export async function seedDatabase(
  input: string | SeedDatabaseOptions = process.env["DATABASE_URL"] ??
    getDefaultDatabaseUrl()
): Promise<void> {
  const options = normalizeSeedDatabaseOptions(input)
  const { databaseUrl } = options

  assertProductionSeedAllowed(options)
  ensureDatabaseDirectory(databaseUrl)

  let client = createWritingAppDatabase(databaseUrl)

  try {
    if (shouldRecreateLegacyDatabase(client, databaseUrl)) {
      client.close()
      recreateDatabaseFile(databaseUrl, options)
      client = createWritingAppDatabase(databaseUrl)
    }

    runBaselineMigration(client.sqlite)
    seedDefaultLearner(client)
    await upsertContentRows(client)
  } finally {
    client.close()
  }
}

function normalizeSeedDatabaseOptions(
  input: string | SeedDatabaseOptions
): Required<SeedDatabaseOptions> {
  if (typeof input === "string") {
    return {
      allowDatabaseReset: false,
      databaseUrl: input,
      forceDatabaseReset: false,
      nodeEnv: process.env["NODE_ENV"] ?? "",
      targetFingerprint: "",
    }
  }

  return {
    allowDatabaseReset: input.allowDatabaseReset ?? false,
    databaseUrl:
      input.databaseUrl ??
      process.env["DATABASE_URL"] ??
      getDefaultDatabaseUrl(),
    forceDatabaseReset: input.forceDatabaseReset ?? false,
    nodeEnv: input.nodeEnv ?? process.env["NODE_ENV"] ?? "",
    targetFingerprint: input.targetFingerprint ?? "",
  }
}

function assertProductionSeedAllowed(
  options: Required<SeedDatabaseOptions>
): void {
  if (options.nodeEnv !== "production") {
    return
  }

  const target = inspectDatabaseResetTarget(options.databaseUrl)

  if (target !== null && target.files.length > 0) {
    assertDestructiveDatabaseAllowed(target, options)
  }
}

function ensureDatabaseDirectory(databaseUrl: string): void {
  const databasePath = getDatabaseFilePath(databaseUrl)

  if (databasePath === null) {
    return
  }

  const directory = dirname(databasePath)

  if (directory !== ".") {
    mkdirSync(directory, { recursive: true })
  }
}

function shouldRecreateLegacyDatabase(
  client: WritingAppDatabaseClient,
  databaseUrl: string
): boolean {
  const databasePath = getDatabaseFilePath(databaseUrl)

  if (databasePath === null || !existsSync(databasePath)) {
    return false
  }

  const tableNames = new Set(
    client.sqlite
      .query<{ readonly name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
      )
      .all()
      .map((row) => row.name)
  )

  if (tableNames.size === 0) {
    return false
  }

  const courseColumns = readTableColumns(client, "courses")
  const hasSharedTables = [
    "user",
    "learner_profiles",
    "learner_lesson_progress",
    "learner_lesson_answers",
  ].every((tableName) => tableNames.has(tableName))
  const hasVersionedSchema = [
    "course_curriculum_versions",
    "course_unit_versions",
    "lesson_versions",
    "lesson_step_versions",
    "learner_course_progress",
  ].every((tableName) => tableNames.has(tableName))
  const hasMigratableLegacySchema = [
    "course_units",
    "lessons",
    "lesson_steps",
  ].every((tableName) => tableNames.has(tableName))

  if (!hasSharedTables) return true
  if (
    hasVersionedSchema &&
    courseColumns.includes("published_curriculum_version_id")
  ) {
    return false
  }

  return !(
    hasMigratableLegacySchema &&
    courseColumns.includes("category") &&
    courseColumns.includes("curriculum_revision")
  )
}

function readTableColumns(
  client: WritingAppDatabaseClient,
  tableName: string
): readonly string[] {
  return client.sqlite
    .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
    .all()
    .map((row) => row.name)
}

function recreateDatabaseFile(
  databaseUrl: string,
  options: Required<SeedDatabaseOptions>
): void {
  const databasePath = getDatabaseFilePath(databaseUrl)

  if (databasePath === null) {
    return
  }

  if (!options.allowDatabaseReset || !options.forceDatabaseReset) {
    throw new Error(
      "DB 파일 재생성은 ALLOW_DATABASE_RESET=true와 --force가 필요합니다."
    )
  }

  resetSqliteDatabaseFiles(options)
}

function getDatabaseFilePath(databaseUrl: string): string | null {
  if (databaseUrl === ":memory:") {
    return null
  }

  if (databaseUrl.startsWith("file://")) {
    return fileURLToPath(databaseUrl)
  }

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(databaseUrl)) {
    return null
  }

  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice("file:".length)
  }

  return databaseUrl
}

function seedDefaultLearner(client: WritingAppDatabaseClient): void {
  const now = new Date("2026-06-14T00:00:00.000Z")

  client.db
    .insert(authUsers)
    .values({
      createdAt: now,
      email: "learner@example.com",
      emailVerified: true,
      id: "user-1",
      image: null,
      name: "글쓰기 탐험가",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      set: {
        email: "learner@example.com",
        emailVerified: true,
        image: null,
        name: "글쓰기 탐험가",
        updatedAt: now,
      },
      target: authUsers.id,
    })
    .run()

  client.db
    .insert(learnerProfiles)
    .values({
      deletedAt: null,
      displayName: "글쓰기 탐험가",
      status: persistedLearnerAccountStatuses.active,
      userId: "user-1",
    })
    .onConflictDoUpdate({
      set: {
        deletedAt: null,
        displayName: "글쓰기 탐험가",
        status: persistedLearnerAccountStatuses.active,
      },
      target: learnerProfiles.userId,
    })
    .run()
}

async function upsertContentRows(
  client: WritingAppDatabaseClient
): Promise<void> {
  const rows = await createDefaultContentSeedRows()

  client.db.transaction((transaction) => {
    upsertContentSeedRows(transaction, rows)
  })
}

export function upsertContentSeedRows(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows
): void {
  archiveContentRowsOutsideSeed(transaction, rows)

  for (const course of rows.courses) {
    const existingCourse = transaction
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, course.id))
      .get()

    if (existingCourse === undefined) {
      insertSeedCourse(transaction, rows, course)
    } else {
      replaceSeedDraft(transaction, rows, course)
    }
  }
}

function insertSeedCourse(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows,
  course: CourseSeedRow
): void {
  const createdAt = new Date("2026-06-14T00:00:00.000Z")
  const publishedVersionId = createCurriculumVersionId(course.id, 1)
  const draftVersionId = createCurriculumVersionId(course.id, 2)

  transaction
    .insert(courses)
    .values({
      createdAt,
      id: course.id,
      publishedCurriculumVersionId: null,
      sortOrder: course.sortOrder,
      status: course.status,
    })
    .run()
  insertCurriculumVersion(transaction, course, {
    createdAt,
    id: publishedVersionId,
    revision: 1,
  })
  insertVersionContent(transaction, rows, course.id, publishedVersionId)
  transaction
    .update(courseCurriculumVersions)
    .set({ publishedAt: createdAt, status: "published", updatedAt: createdAt })
    .where(eq(courseCurriculumVersions.id, publishedVersionId))
    .run()
  transaction
    .update(courses)
    .set({ publishedCurriculumVersionId: publishedVersionId })
    .where(eq(courses.id, course.id))
    .run()

  insertCurriculumVersion(transaction, course, {
    createdAt,
    id: draftVersionId,
    revision: 2,
  })
  insertVersionContent(transaction, rows, course.id, draftVersionId)
}

function replaceSeedDraft(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows,
  course: CourseSeedRow
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
  const now = new Date("2026-06-14T00:00:00.000Z")

  if (existingDraft === undefined) {
    const nextRevision =
      transaction
        .select({
          value: sql<number>`COALESCE(MAX(${courseCurriculumVersions.revision}), 0) + 1`,
        })
        .from(courseCurriculumVersions)
        .where(eq(courseCurriculumVersions.courseId, course.id))
        .get()?.value ?? 1
    const draftVersionId = createCurriculumVersionId(course.id, nextRevision)
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

if (import.meta.main) {
  await seedDatabase({
    allowDatabaseReset: process.env["ALLOW_DATABASE_RESET"] === "true",
    databaseUrl: process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl(),
    forceDatabaseReset: process.argv.includes("--force"),
    targetFingerprint: process.argv
      .find((argument) => argument.startsWith("--target-fingerprint="))
      ?.slice("--target-fingerprint=".length),
  })
}
