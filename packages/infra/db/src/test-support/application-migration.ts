import { readFileSync } from "node:fs"

import type { Database } from "bun:sqlite"

/** API의 append-only migration 순서와 같아야 한다. */
const applicationMigrationFileNames = [
  "0000-current-schema-baseline.sql",
  "0001-reporting-views.sql",
] as const

export function runCurrentTestMigration(sqlite: Database): void {
  for (const fileName of applicationMigrationFileNames) {
    sqlite.exec(
      readFileSync(
        new URL(`../../../../../apps/api/drizzle/${fileName}`, import.meta.url),
        "utf8"
      )
    )
  }
}
