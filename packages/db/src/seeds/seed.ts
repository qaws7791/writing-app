import { existsSync, mkdirSync, rmSync } from "node:fs"
import { dirname, isAbsolute, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  createKwepDatabase,
  getDefaultDatabaseUrl,
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
import { createDefaultContentSeedRows } from "@workspace/db/seeds/seed-content"

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
    clearContentRows(client)
    await insertContentRows(client)
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

function clearContentRows(client: KwepDatabaseClient): void {
  client.db.delete(lessonSteps).run()
  client.db.delete(lessons).run()
  client.db.delete(courseUnits).run()
  client.db.delete(courses).run()
}

async function insertContentRows(client: KwepDatabaseClient): Promise<void> {
  const rows = await createDefaultContentSeedRows()

  client.db
    .insert(courses)
    .values([...rows.courses])
    .run()
  client.db
    .insert(courseUnits)
    .values([...rows.units])
    .run()
  client.db
    .insert(lessons)
    .values([...rows.lessons])
    .run()
  client.db
    .insert(lessonSteps)
    .values([...rows.steps])
    .run()
}

if (import.meta.main) {
  await seedDatabase({
    allowDatabaseReset: process.env["ALLOW_DATABASE_RESET"] === "true",
    databaseUrl: process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl(),
    forceDatabaseReset: process.argv.includes("--force"),
  })
}
