import { readFileSync } from "node:fs"
import type { Database } from "bun:sqlite"

const migrationSql = readFileSync(
  new URL("./0000-initial-content.sql", import.meta.url),
  "utf8"
)

export function runContentMigration(sqlite: Database) {
  sqlite.exec(migrationSql)
}
