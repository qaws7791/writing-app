import { readFileSync } from "node:fs"

import type { Database } from "bun:sqlite"

import { createKwepDatabase } from "@workspace/db/client"

const baselineMigrationUrl = new URL(
  "./0000-kwep-baseline.sql",
  import.meta.url
)

export function readBaselineMigrationSql(): string {
  return readFileSync(baselineMigrationUrl, "utf8")
}

export function runBaselineMigration(sqlite: Database): void {
  sqlite.exec(readBaselineMigrationSql())
}

if (import.meta.main) {
  const client = createKwepDatabase()

  try {
    runBaselineMigration(client.sqlite)
  } finally {
    client.close()
  }
}
