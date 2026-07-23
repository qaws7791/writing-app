import { readFileSync } from "node:fs"

import type { Database } from "bun:sqlite"

const currentSchemaBaselineUrl = new URL(
  "../../../../../apps/api/drizzle/0000-current-schema-baseline.sql",
  import.meta.url
)

export function runCurrentTestMigration(sqlite: Database): void {
  sqlite.exec(readFileSync(currentSchemaBaselineUrl, "utf8"))
}
