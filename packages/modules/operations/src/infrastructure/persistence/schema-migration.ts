import type { Database } from "bun:sqlite"

export function runOperationsSchemaMigration(sqlite: Database): void {
  migrateLegacyConversationOwnership(sqlite)
  sqlite.exec(`
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY NOT NULL,
  updated_at INTEGER NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_ai_chat_conversations (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_ai_chat_messages (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES admin_ai_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('assistant', 'user')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS operations_ai_quota_counters (
  key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL CHECK (count >= 0),
  reset_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS operations_ai_change_proposals (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES admin_ai_chat_conversations(id) ON DELETE CASCADE,
  created_by_admin_id TEXT NOT NULL,
  change_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('proposed', 'applying', 'approved', 'rejected')),
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  reviewed_by_admin_id TEXT
);

CREATE INDEX IF NOT EXISTS admin_ai_chat_conversations_admin_updated_idx
ON admin_ai_chat_conversations(admin_id, updated_at);

CREATE INDEX IF NOT EXISTS admin_ai_chat_messages_conversation_created_idx
ON admin_ai_chat_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS operations_ai_quota_reset_idx
ON operations_ai_quota_counters(reset_at);

CREATE INDEX IF NOT EXISTS operations_ai_change_proposals_conversation_idx
ON operations_ai_change_proposals(conversation_id, created_at);
`)
}

function migrateLegacyConversationOwnership(sqlite: Database): void {
  if (!hasTable(sqlite, "admin_ai_chat_conversations")) return
  const foreignKeys = sqlite
    .query<{ readonly table: string }, []>(
      "PRAGMA foreign_key_list(admin_ai_chat_conversations)"
    )
    .all()
  if (!foreignKeys.some((foreignKey) => foreignKey.table === "admin_user")) {
    return
  }

  sqlite.exec("PRAGMA foreign_keys = OFF")
  sqlite.exec("BEGIN IMMEDIATE")
  try {
    sqlite.exec(`
ALTER TABLE admin_ai_chat_messages RENAME TO admin_ai_chat_messages_legacy;
ALTER TABLE admin_ai_chat_conversations RENAME TO admin_ai_chat_conversations_legacy;

CREATE TABLE admin_ai_chat_conversations (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE admin_ai_chat_messages (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES admin_ai_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('assistant', 'user')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

INSERT INTO admin_ai_chat_conversations
SELECT id, title, admin_id, created_at, updated_at
FROM admin_ai_chat_conversations_legacy;

INSERT INTO admin_ai_chat_messages
SELECT id, conversation_id, role, content, created_at
FROM admin_ai_chat_messages_legacy;

DROP TABLE admin_ai_chat_messages_legacy;
DROP TABLE admin_ai_chat_conversations_legacy;
`)
    const violation = sqlite
      .query<unknown, []>("PRAGMA foreign_key_check")
      .get()
    if (violation !== null) {
      throw new Error(
        "operations migration prerequisite failed: foreign key violation"
      )
    }
    sqlite.exec("COMMIT")
  } catch (error) {
    sqlite.exec("ROLLBACK")
    throw error
  } finally {
    sqlite.exec("PRAGMA foreign_keys = ON")
  }
}

function hasTable(sqlite: Database, tableName: string): boolean {
  return (
    sqlite
      .query<{ readonly value: number }, [string]>(
        "SELECT 1 AS value FROM sqlite_master WHERE type = 'table' AND name = ?"
      )
      .get(tableName) !== null
  )
}
