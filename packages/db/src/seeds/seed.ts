import { existsSync, mkdirSync, rmSync } from "node:fs"
import { dirname } from "node:path"
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
import {
  createContentSeedRows,
  type KwepCourseSeed,
} from "@workspace/db/seeds/seed-content"

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
    clearContentRows(client)
    await insertContentRows(client)
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

function clearContentRows(client: KwepDatabaseClient): void {
  client.db.delete(lessonSteps).run()
  client.db.delete(lessons).run()
  client.db.delete(courseUnits).run()
  client.db.delete(courses).run()
}

async function insertContentRows(client: KwepDatabaseClient): Promise<void> {
  const rows = createContentSeedRows(await readContentSeedData())

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

async function readContentSeedData(): Promise<readonly KwepCourseSeed[]> {
  const seedUrl = new URL("./content-seed-data.json", import.meta.url)

  return (await Bun.file(seedUrl).json()) as readonly KwepCourseSeed[]
}

if (import.meta.main) {
  await seedDatabase()
}
