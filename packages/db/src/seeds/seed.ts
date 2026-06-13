import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

import {
  createKwepDatabase,
  type KwepDatabaseClient,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import {
  courses,
  courseUnits,
  lessons,
  lessonSteps,
} from "@workspace/db/schema"
import {
  createContentSeedRows,
  type KwepCourseSeed,
} from "@workspace/db/seeds/seed-content"

const defaultDatabaseUrl = "data/api.sqlite"

export async function seedDatabase(
  databaseUrl = process.env["DATABASE_URL"] ?? defaultDatabaseUrl
): Promise<void> {
  ensureDatabaseDirectory(databaseUrl)

  const client = createKwepDatabase(databaseUrl)

  try {
    runBaselineMigration(client.sqlite)
    clearContentRows(client)
    await insertContentRows(client)
  } finally {
    client.close()
  }
}

function ensureDatabaseDirectory(databaseUrl: string): void {
  if (databaseUrl === ":memory:" || databaseUrl.startsWith("file:")) {
    return
  }

  const directory = dirname(databaseUrl)

  if (directory !== ".") {
    mkdirSync(directory, { recursive: true })
  }
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
