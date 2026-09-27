import { readFileSync, readdirSync } from "node:fs"
import type { SqlDatabaseClient } from "#db/sql-client"
export async function runCurrentTestMigration(
  database: SqlDatabaseClient
): Promise<void> {
  const directory = new URL(
    "../../../../../apps/api/migrations/",
    import.meta.url
  )
  for (const file of readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    const statements = readFileSync(new URL(file, directory), "utf8")
      .split("--> statement-breakpoint")
      .map((statement) => database.binding.prepare(statement.trim()))
    await database.binding.batch(statements)
  }
}
