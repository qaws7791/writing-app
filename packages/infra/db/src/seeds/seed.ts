import { existsSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
  type WritingAppDatabaseClient,
} from "#db/client"
import {
  assertDestructiveDatabaseAllowed,
  inspectDatabaseResetTarget,
  resetSqliteDatabaseFiles,
} from "#db/destructive-operation-guard"
import { runBaselineMigration } from "#db/migrations/migrate"
import type { NormalizeVersionedStepContent } from "#db/migrations/curriculum-migration"
import { authUsers } from "#db/schema"

export type SeedDatabaseOptions = {
  readonly allowDatabaseReset?: boolean
  readonly databaseUrl?: string
  readonly forceDatabaseReset?: boolean
  readonly normalizeVersionedStepContent?: NormalizeVersionedStepContent
  readonly nodeEnv?: string
  readonly targetFingerprint?: string
}

type NormalizedSeedDatabaseOptions = Required<
  Omit<SeedDatabaseOptions, "normalizeVersionedStepContent">
> &
  Readonly<{
    normalizeVersionedStepContent: NormalizeVersionedStepContent | undefined
  }>

export async function seedDatabase(
  input: string | SeedDatabaseOptions
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

    runBaselineMigration(
      client.sqlite,
      options.normalizeVersionedStepContent === undefined
        ? {}
        : {
            normalizeVersionedStepContent:
              options.normalizeVersionedStepContent,
          }
    )
    seedDefaultLearner(client)
  } finally {
    client.close()
  }
}

function normalizeSeedDatabaseOptions(
  input: string | SeedDatabaseOptions
): NormalizedSeedDatabaseOptions {
  if (typeof input === "string") {
    return {
      allowDatabaseReset: false,
      databaseUrl: input,
      forceDatabaseReset: false,
      normalizeVersionedStepContent: undefined,
      nodeEnv: "",
      targetFingerprint: "",
    }
  }

  return {
    allowDatabaseReset: input.allowDatabaseReset ?? false,
    databaseUrl: input.databaseUrl ?? getDefaultDatabaseUrl(),
    forceDatabaseReset: input.forceDatabaseReset ?? false,
    normalizeVersionedStepContent: input.normalizeVersionedStepContent,
    nodeEnv: input.nodeEnv ?? "",
    targetFingerprint: input.targetFingerprint ?? "",
  }
}

function assertProductionSeedAllowed(
  options: NormalizedSeedDatabaseOptions
): void {
  if (options.nodeEnv !== "production") return

  const target = inspectDatabaseResetTarget(options.databaseUrl)
  if (target !== null && target.files.length > 0) {
    assertDestructiveDatabaseAllowed(target, options)
  }
}

function ensureDatabaseDirectory(databaseUrl: string): void {
  const databasePath = getDatabaseFilePath(databaseUrl)
  if (databasePath === null) return

  const directory = dirname(databasePath)
  if (directory !== ".") mkdirSync(directory, { recursive: true })
}

function shouldRecreateLegacyDatabase(
  client: WritingAppDatabaseClient,
  databaseUrl: string
): boolean {
  const databasePath = getDatabaseFilePath(databaseUrl)
  if (databasePath === null || !existsSync(databasePath)) return false

  const tableNames = new Set(
    client.sqlite
      .query<{ readonly name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
      )
      .all()
      .map((row) => row.name)
  )
  if (tableNames.size === 0) return false

  const courseColumns = readTableColumns(client, "courses")
  const hasSharedTables = [
    "user",
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
  options: NormalizedSeedDatabaseOptions
): void {
  const databasePath = getDatabaseFilePath(databaseUrl)
  if (databasePath === null) return

  if (!options.allowDatabaseReset || !options.forceDatabaseReset) {
    throw new Error(
      "DB 파일 재생성은 ALLOW_DATABASE_RESET=true와 --force가 필요합니다."
    )
  }

  resetSqliteDatabaseFiles(options)
}

function getDatabaseFilePath(databaseUrl: string): string | null {
  if (databaseUrl === ":memory:") return null
  if (databaseUrl.startsWith("file://")) return fileURLToPath(databaseUrl)
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(databaseUrl)) return null
  return databaseUrl.startsWith("file:")
    ? databaseUrl.slice("file:".length)
    : databaseUrl
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
}
