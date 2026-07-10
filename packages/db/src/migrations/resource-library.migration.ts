import { readFileSync } from "node:fs"

import type { Database } from "bun:sqlite"

import {
  createWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"

const resourceLibraryMigrationUrl = new URL(
  "./0001-resource-library.sql",
  import.meta.url
)

type ResourceDocumentSchemaState = "current" | "legacy" | "missing"

export function readResourceLibraryMigrationSql(): string {
  return readFileSync(resourceLibraryMigrationUrl, "utf8")
}

export function runResourceLibraryMigration(sqlite: Database): void {
  const state = readResourceDocumentSchemaState(sqlite)

  sqlite.transaction(() => {
    if (state === "legacy") {
      sqlite.exec("DROP TABLE admin_resource_documents")
    }

    sqlite.exec(readResourceLibraryMigrationSql())
  })()
}

function readResourceDocumentSchemaState(
  sqlite: Database
): ResourceDocumentSchemaState {
  const columns = sqlite
    .query<{ readonly name: string }, []>(
      "PRAGMA table_info(admin_resource_documents)"
    )
    .all()
    .map(({ name }) => name)

  if (columns.length === 0) {
    return "missing"
  }

  if (columns.includes("content_json")) {
    return "legacy"
  }

  if (
    columns.length === 3 &&
    columns.includes("node_id") &&
    columns.includes("content_markdown") &&
    columns.includes("content_revision")
  ) {
    return "current"
  }

  throw new Error("알 수 없는 admin_resource_documents schema입니다.")
}

function migrateDefaultDatabase(client: WritingAppDatabaseClient): void {
  try {
    runResourceLibraryMigration(client.sqlite)
  } finally {
    client.close()
  }
}

if (import.meta.main) {
  migrateDefaultDatabase(createWritingAppDatabase())
}
