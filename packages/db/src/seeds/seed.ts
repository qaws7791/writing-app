import { existsSync, mkdirSync, rmSync } from "node:fs"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { sql } from "drizzle-orm"

import {
  createKwepDatabase,
  getDefaultDatabaseUrl,
  type KwepDatabase,
  type KwepDatabaseClient,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import {
  authUsers,
  courses,
  courseUnits,
  learnerProfiles,
  lessons,
  lessonSteps,
} from "@workspace/db/schema"
import {
  createDefaultContentSeedRows,
  type CourseSeedRow,
  type CourseUnitSeedRow,
  type LessonSeedRow,
  type LessonStepSeedRow,
} from "@workspace/db/seeds/seed-content"

type KwepDatabaseTransaction = Parameters<
  Parameters<KwepDatabase["transaction"]>[0]
>[0]

export async function seedDatabase(
  databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
): Promise<void> {
  ensureDatabaseDirectory(databaseUrl)

  let client = createKwepDatabase(databaseUrl)

  try {
    if (shouldRecreateLegacyDatabase(client, databaseUrl)) {
      client.close()
      recreateDatabaseFile(databaseUrl)
      client = createKwepDatabase(databaseUrl)
    }

    runBaselineMigration(client.sqlite)
    seedDefaultLearner(client)
    await upsertContentRows(client)
  } finally {
    client.close()
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
  client: KwepDatabaseClient,
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

  const requiredTables = [
    "auth_users",
    "course_units",
    "learner_profiles",
    "learner_lesson_progress",
    "learner_lesson_answers",
  ]

  if (requiredTables.some((tableName) => !tableNames.has(tableName))) {
    return true
  }

  const courseColumns = readTableColumns(client, "courses")

  return (
    courseColumns.length > 0 &&
    (!courseColumns.includes("category") ||
      !courseColumns.includes("curriculum_revision"))
  )
}

function readTableColumns(
  client: KwepDatabaseClient,
  tableName: string
): readonly string[] {
  return client.sqlite
    .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
    .all()
    .map((row) => row.name)
}

function recreateDatabaseFile(databaseUrl: string): void {
  const databasePath = getDatabaseFilePath(databaseUrl)

  if (databasePath === null) {
    return
  }

  rmSync(databasePath, { force: true })
  rmSync(`${databasePath}-shm`, { force: true })
  rmSync(`${databasePath}-wal`, { force: true })
}

function getDatabaseFilePath(databaseUrl: string): string | null {
  if (databaseUrl === ":memory:") {
    return null
  }

  if (databaseUrl.startsWith("file://")) {
    return fileURLToPath(databaseUrl)
  }

  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice("file:".length)
  }

  return databaseUrl
}

function seedDefaultLearner(client: KwepDatabaseClient): void {
  const now = new Date("2026-06-14T00:00:00.000Z")

  client.db
    .insert(authUsers)
    .values({
      createdAt: now,
      email: "learner@example.com",
      emailVerified: true,
      id: "user-1",
      image: null,
      name: "학습자",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      set: {
        email: "learner@example.com",
        emailVerified: true,
        image: null,
        name: "학습자",
        updatedAt: now,
      },
      target: authUsers.id,
    })
    .run()

  client.db
    .insert(learnerProfiles)
    .values({
      deletedAt: null,
      displayName: "학습자",
      status: "active",
      userId: "user-1",
    })
    .onConflictDoUpdate({
      set: {
        deletedAt: null,
        displayName: "학습자",
        status: "active",
      },
      target: learnerProfiles.userId,
    })
    .run()
}

async function upsertContentRows(client: KwepDatabaseClient): Promise<void> {
  const rows = await createDefaultContentSeedRows()

  client.db.transaction((transaction) => {
    archiveMissingContentRows(transaction, rows)
    upsertCourses(transaction, rows.courses)
    upsertCourseUnits(transaction, rows.units)
    upsertLessons(transaction, rows.lessons)
    upsertLessonSteps(transaction, rows.steps)
  })
}

function archiveMissingContentRows(
  transaction: KwepDatabaseTransaction,
  rows: Awaited<ReturnType<typeof createDefaultContentSeedRows>>
): void {
  const courseIds = rows.courses.map((row) => row.id)
  const unitIds = rows.units.map((row) => row.id)
  const lessonIds = rows.lessons.map((row) => row.id)
  const stepIds = rows.steps.map((row) => row.id)

  archiveRowsNotIn(transaction, "courses", courseIds)
  archiveRowsNotIn(transaction, "course_units", unitIds)
  archiveRowsNotIn(transaction, "lessons", lessonIds)
  archiveRowsNotIn(transaction, "lesson_steps", stepIds)
}

function archiveRowsNotIn(
  transaction: KwepDatabaseTransaction,
  tableName: "course_units" | "courses" | "lesson_steps" | "lessons",
  activeIds: readonly string[]
): void {
  if (activeIds.length === 0) {
    transaction.run(
      sql`UPDATE ${sql.identifier(tableName)} SET status = 'archived'`
    )
    return
  }

  const activeIdValues = activeIds.map((id) => sql`${id}`)

  transaction.run(
    sql`UPDATE ${sql.identifier(tableName)} SET status = 'archived' WHERE id NOT IN (${sql.join(activeIdValues, sql`, `)})`
  )
}

function upsertCourses(
  transaction: KwepDatabaseTransaction,
  rows: readonly CourseSeedRow[]
): void {
  for (const row of rows) {
    transaction
      .insert(courses)
      .values(row)
      .onConflictDoUpdate({
        set: {
          category: row.category,
          curriculumRevision: row.curriculumRevision,
          description: row.description,
          sortOrder: row.sortOrder,
          status: row.status,
          title: row.title,
        },
        target: courses.id,
      })
      .run()
  }
}

function upsertCourseUnits(
  transaction: KwepDatabaseTransaction,
  rows: readonly CourseUnitSeedRow[]
): void {
  for (const row of rows) {
    transaction
      .insert(courseUnits)
      .values(row)
      .onConflictDoUpdate({
        set: {
          courseId: row.courseId,
          sortOrder: row.sortOrder,
          status: row.status,
          title: row.title,
        },
        target: courseUnits.id,
      })
      .run()
  }
}

function upsertLessons(
  transaction: KwepDatabaseTransaction,
  rows: readonly LessonSeedRow[]
): void {
  for (const row of rows) {
    transaction
      .insert(lessons)
      .values(row)
      .onConflictDoUpdate({
        set: {
          category: row.category,
          courseId: row.courseId,
          description: row.description,
          estimatedMinutes: row.estimatedMinutes,
          sortOrder: row.sortOrder,
          status: row.status,
          summaryJson: row.summaryJson,
          title: row.title,
          unitId: row.unitId,
        },
        target: lessons.id,
      })
      .run()
  }
}

function upsertLessonSteps(
  transaction: KwepDatabaseTransaction,
  rows: readonly LessonStepSeedRow[]
): void {
  for (const row of rows) {
    transaction
      .insert(lessonSteps)
      .values(row)
      .onConflictDoUpdate({
        set: {
          contentJson: row.contentJson,
          lessonId: row.lessonId,
          sortOrder: row.sortOrder,
          status: row.status,
          type: row.type,
        },
        target: lessonSteps.id,
      })
      .run()
  }
}

if (import.meta.main) {
  await seedDatabase()
}
