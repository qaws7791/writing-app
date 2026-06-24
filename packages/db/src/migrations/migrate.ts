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
  ensureAdminResourceAndChatTables(sqlite)
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

function ensureAdminResourceAndChatTables(sqlite: Database): void {
  sqlite.exec(`
CREATE TABLE IF NOT EXISTS admin_resource_documents (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  author_id TEXT NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_ai_chat_conversations (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  admin_id TEXT NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_ai_chat_messages (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES admin_ai_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`)
}

if (import.meta.main) {
  const client = createWritingAppDatabase()

  try {
    runBaselineMigration(client.sqlite)
  } finally {
    client.close()
  }
}
