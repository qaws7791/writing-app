import { existsSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { archiveContentRowsOutsideSeed } from "@/content/content-archive-policy"
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

  const requiredTables = [
    "user",
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
    archiveContentRowsOutsideSeed(transaction, rows)
    upsertCourses(transaction, rows.courses)
    upsertCourseUnits(transaction, rows.units)
    upsertLessons(transaction, rows.lessons)
    upsertLessonSteps(transaction, rows.steps)
  })
}

function upsertCourses(
  transaction: WritingAppDatabaseTransaction,
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
          visualKey: row.visualKey,
        },
        target: courses.id,
      })
      .run()
  }
}

function upsertCourseUnits(
  transaction: WritingAppDatabaseTransaction,
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
  transaction: WritingAppDatabaseTransaction,
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
  transaction: WritingAppDatabaseTransaction,
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
  await seedDatabase({
    allowDatabaseReset: process.env["ALLOW_DATABASE_RESET"] === "true",
    databaseUrl: process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl(),
    forceDatabaseReset: process.argv.includes("--force"),
    targetFingerprint: process.argv
      .find((argument) => argument.startsWith("--target-fingerprint="))
      ?.slice("--target-fingerprint=".length),
  })
}
