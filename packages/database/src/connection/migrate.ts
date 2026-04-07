import { fileURLToPath } from "node:url"

import { migrate } from "drizzle-orm/postgres-js/migrator"

import type { DbClient } from "../types/index"

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
