import { fileURLToPath } from "node:url"

import { migrate } from "drizzle-orm/bun-sqlite/migrator"

import type { DbClient } from "../types/index"

const defaultMigrationsFolder = fileURLToPath(
  new URL("../../drizzle", import.meta.url)
)

export async function migrateDatabase(
  database: DbClient,
  migrationsFolder = defaultMigrationsFolder
): Promise<void> {
  migrate(database, {
    migrationsFolder,
  })
}
