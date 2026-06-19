import { readFileSync } from "node:fs"

import type { Database } from "bun:sqlite"

import { createWritingAppDatabase } from "@workspace/db/client"

const baselineMigrationUrl = new URL(
  "./0000-writing-app-baseline.sql",
  import.meta.url
)

export function readBaselineMigrationSql(): string {
  return readFileSync(baselineMigrationUrl, "utf8")
}

export function runBaselineMigration(sqlite: Database): void {
  sqlite.exec(readBaselineMigrationSql())
}

if (import.meta.main) {
  const client = createWritingAppDatabase()

  try {
    runBaselineMigration(client.sqlite)
  } finally {
    client.close()
  }
}
