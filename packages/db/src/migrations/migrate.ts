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
  ensureCourseVisualKeyColumn(sqlite)
}

function ensureCourseVisualKeyColumn(sqlite: Database): void {
  const courseColumns = sqlite
    .query<{ readonly name: string }, []>("PRAGMA table_info(courses)")
    .all()
    .map((row) => row.name)

  if (courseColumns.includes("visual_key")) {
    return
  }

  sqlite.exec(
    "ALTER TABLE courses ADD COLUMN visual_key TEXT NOT NULL DEFAULT 'basic-sentence-writing'"
  )
}

if (import.meta.main) {
  const client = createWritingAppDatabase()

  try {
    runBaselineMigration(client.sqlite)
  } finally {
    client.close()
  }
}
