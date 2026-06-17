import { existsSync, mkdirSync, rmSync } from "node:fs"
import { dirname, isAbsolute, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { learnerAccountStatuses } from "@workspace/core/status"

import { archiveContentRowsOutsideSeed } from "@/content/content-archive-policy"
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

const repositoryDataDirectory = fileURLToPath(
  new URL("../../../../data/", import.meta.url)
)

export type SeedDatabaseOptions = {
  readonly allowDatabaseReset?: boolean
  readonly databaseUrl?: string
  readonly forceDatabaseReset?: boolean
  readonly nodeEnv?: string
}

export async function seedDatabase(
  input: string | SeedDatabaseOptions = process.env["DATABASE_URL"] ??
    getDefaultDatabaseUrl()
): Promise<void> {
  const options = normalizeSeedDatabaseOptions(input)
  const { databaseUrl } = options

  assertProductionSeedAllowed(options)
  ensureDatabaseDirectory(databaseUrl)

  let client = createKwepDatabase(databaseUrl)

  try {
    if (shouldRecreateLegacyDatabase(client, databaseUrl)) {
      client.close()
      recreateDatabaseFile(databaseUrl, options)
      client = createKwepDatabase(databaseUrl)
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
  }
}

function assertProductionSeedAllowed(
  options: Required<SeedDatabaseOptions>
): void {
  if (options.nodeEnv !== "production") {
    return
  }

  if (!options.allowDatabaseReset || !options.forceDatabaseReset) {
    throw new Error(
      "production DB seed 실행은 ALLOW_DATABASE_RESET=true와 --force가 필요합니다."
    )
  }

  const databasePath = getDatabaseFilePath(options.databaseUrl)

  if (databasePath !== null && !isRepositoryDataPath(databasePath)) {
    throw new Error("저장소 data 디렉터리 밖의 DB 파일은 재생성할 수 없습니다.")
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
  client: KwepDatabaseClient,
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

  assertDatabaseResetAllowed(databasePath, options)

  rmSync(databasePath, { force: true })
  rmSync(`${databasePath}-shm`, { force: true })
  rmSync(`${databasePath}-wal`, { force: true })
}

function assertDatabaseResetAllowed(
  databasePath: string,
  options: Required<SeedDatabaseOptions>
): void {
  if (!options.allowDatabaseReset || !options.forceDatabaseReset) {
    throw new Error(
      "DB 파일 재생성은 ALLOW_DATABASE_RESET=true와 --force가 필요합니다."
    )
  }

  if (!isRepositoryDataPath(databasePath)) {
    throw new Error("저장소 data 디렉터리 밖의 DB 파일은 재생성할 수 없습니다.")
  }
}

function isRepositoryDataPath(databasePath: string): boolean {
  const relativePath = relative(
    resolve(repositoryDataDirectory),
    resolve(databasePath)
  )

  return (
    relativePath !== "" &&
    !relativePath.startsWith("..") &&
    !isAbsolute(relativePath)
  )
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
      status: learnerAccountStatuses.active,
      userId: "user-1",
    })
    .onConflictDoUpdate({
      set: {
        deletedAt: null,
        displayName: "학습자",
        status: learnerAccountStatuses.active,
      },
      target: learnerProfiles.userId,
    })
    .run()
}

async function upsertContentRows(client: KwepDatabaseClient): Promise<void> {
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
  await seedDatabase({
    allowDatabaseReset: process.env["ALLOW_DATABASE_RESET"] === "true",
    databaseUrl: process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl(),
    forceDatabaseReset: process.argv.includes("--force"),
  })
}
