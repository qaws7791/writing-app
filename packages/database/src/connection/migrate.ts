import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { migrate } from "drizzle-orm/bun-sqlite/migrator"

import type { DbClient } from "../types/index"

export async function migrateDatabase(
  database: DbClient,
  migrationsFolder?: string
): Promise<void> {
  const folder =
    migrationsFolder ??
    resolve(dirname(fileURLToPath(import.meta.url)), "../../drizzle")
  migrate(database, { migrationsFolder: folder })
}
