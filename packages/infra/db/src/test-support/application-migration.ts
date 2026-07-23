import { readFileSync } from "node:fs"

import type { Database } from "bun:sqlite"

const baselineMigrationUrl = new URL(
  "../../../../../apps/api/drizzle/0000-writing-app-baseline.sql",
  import.meta.url
)
const moduleOwnershipMigrationUrl = new URL(
  "../../../../../apps/api/drizzle/0001-module-schema-ownership.sql",
  import.meta.url
)
const referenceIntegrityMigrationUrl = new URL(
  "../../../../../apps/api/drizzle/0002-cross-module-reference-integrity.sql",
  import.meta.url
)

export function readBaselineTestMigrationSql(): string {
  return readFileSync(baselineMigrationUrl, "utf8")
}

export function runBaselineTestMigration(sqlite: Database): void {
  sqlite.exec(readBaselineTestMigrationSql())
}

export function runCurrentTestMigration(sqlite: Database): void {
  const foreignKeysEnabled =
    sqlite
      .query<{ readonly enabled: number }, []>(
        "SELECT foreign_keys AS enabled FROM pragma_foreign_keys"
      )
      .get()?.enabled === 1
  try {
    sqlite.exec("PRAGMA foreign_keys = OFF")
    sqlite.exec(readBaselineTestMigrationSql())
    sqlite.exec(readFileSync(moduleOwnershipMigrationUrl, "utf8"))
    sqlite.exec(readFileSync(referenceIntegrityMigrationUrl, "utf8"))
  } finally {
    sqlite.exec(`PRAGMA foreign_keys = ${foreignKeysEnabled ? "ON" : "OFF"}`)
  }
}
