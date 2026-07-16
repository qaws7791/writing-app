import { readFileSync } from "node:fs"

import type { Database } from "bun:sqlite"

import { createWritingAppDatabase } from "@workspace/db/client"
import {
  hasLegacyCurriculumSchema,
  migrateLegacyCurriculumSchema,
} from "@workspace/db/migrations/curriculum-migration"

const baselineMigrationUrl = new URL(
  "./0000-writing-app-baseline.sql",
  import.meta.url
)

export function readBaselineMigrationSql(): string {
  return readFileSync(baselineMigrationUrl, "utf8")
}

export function runBaselineMigration(sqlite: Database): void {
  const baselineSql = readBaselineMigrationSql()

  if (hasLegacyCurriculumSchema(sqlite)) {
    ensureAiFeedbackAttemptStateModel(sqlite)
    migrateLegacyCurriculumSchema(sqlite, baselineSql)
  } else {
    sqlite.exec(baselineSql)
  }

  ensureAdminChatTables(sqlite)
  removeAdminMfaSchema(sqlite)
}

function removeAdminMfaSchema(sqlite: Database): void {
  sqlite.exec(`
DROP TABLE IF EXISTS admin_mfa_recovery_code;
DROP TABLE IF EXISTS admin_two_factor;
`)

  const adminUserColumns = sqlite
    .query<{ readonly name: string }, []>("PRAGMA table_info(admin_user)")
    .all()
    .map((row) => row.name)

  if (adminUserColumns.includes("two_factor_enabled")) {
    sqlite.exec("ALTER TABLE admin_user DROP COLUMN two_factor_enabled")
  }
}

function ensureAiFeedbackAttemptStateModel(sqlite: Database): void {
  const attemptColumns = sqlite
    .query<{ readonly name: string }, []>(
      "PRAGMA table_info(ai_feedback_attempts)"
    )
    .all()
    .map((row) => row.name)

  if (attemptColumns.length === 0 || attemptColumns.includes("status")) {
    return
  }

  sqlite.exec(`
BEGIN IMMEDIATE;
ALTER TABLE ai_feedback_attempts RENAME TO ai_feedback_attempts_legacy;

CREATE TABLE ai_feedback_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL REFERENCES lesson_steps(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'expired')),
  answer_text TEXT NOT NULL,
  result_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

INSERT INTO ai_feedback_attempts (
  id,
  user_id,
  lesson_id,
  step_id,
  attempt_number,
  idempotency_key,
  status,
  answer_text,
  result_json,
  created_at,
  updated_at,
  expires_at
)
SELECT
  'legacy:' || user_id || ':' || lesson_id || ':' || step_id || ':' || attempt_number,
  user_id,
  lesson_id,
  step_id,
  attempt_number,
  'legacy:' || attempt_number,
  'succeeded',
  answer_text,
  result_json,
  created_at,
  created_at,
  created_at
FROM ai_feedback_attempts_legacy;

DROP TABLE ai_feedback_attempts_legacy;

CREATE UNIQUE INDEX ai_feedback_attempts_idempotency_idx
ON ai_feedback_attempts(user_id, lesson_id, step_id, idempotency_key);

CREATE UNIQUE INDEX ai_feedback_attempts_active_slot_idx
ON ai_feedback_attempts(user_id, lesson_id, step_id, attempt_number)
WHERE status IN ('pending', 'succeeded');

CREATE UNIQUE INDEX ai_feedback_attempts_pending_idx
ON ai_feedback_attempts(user_id, lesson_id, step_id)
WHERE status = 'pending';

CREATE INDEX ai_feedback_attempts_expiry_idx
ON ai_feedback_attempts(status, expires_at);
COMMIT;
`)
}

function ensureAdminChatTables(sqlite: Database): void {
  sqlite.exec(`
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

CREATE INDEX IF NOT EXISTS admin_ai_chat_conversations_admin_updated_idx
ON admin_ai_chat_conversations(admin_id, updated_at);

CREATE INDEX IF NOT EXISTS admin_ai_chat_messages_conversation_created_idx
ON admin_ai_chat_messages(conversation_id, created_at);
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
