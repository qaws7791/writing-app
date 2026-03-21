import { fileURLToPath } from "node:url"

import { migrate } from "drizzle-orm/bun-sqlite/migrator"

import type { DbClient } from "../types/index.js"

const defaultMigrationsFolder = fileURLToPath(
  new URL("../../drizzle", import.meta.url)
)

export async function migrateDatabase(
  database: DbClient,
  migrationsFolder = defaultMigrationsFolder
): Promise<void> {
  await migrate(database, {
    migrationsFolder,
  })
}
