import { readFileSync } from "node:fs"

import type { Database } from "bun:sqlite"

const baselineMigrationUrl = new URL(
  "../../../../../apps/api/drizzle/0000-writing-app-baseline.sql",
  import.meta.url
)

export function readBaselineTestMigrationSql(): string {
  return readFileSync(baselineMigrationUrl, "utf8")
}

export function runBaselineTestMigration(sqlite: Database): void {
  sqlite.exec(readBaselineTestMigrationSql())
}
