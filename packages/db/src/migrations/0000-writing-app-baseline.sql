PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  id_token TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS admin_user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'operator',
  two_factor_enabled INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_session (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_account (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  id_token TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_two_factor (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  backup_codes TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  failed_verification_count INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER
);

CREATE INDEX IF NOT EXISTS admin_two_factor_user_idx
ON admin_two_factor(user_id);

CREATE TABLE IF NOT EXISTS admin_mfa_recovery_code (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE INDEX IF NOT EXISTS admin_mfa_recovery_code_user_idx
ON admin_mfa_recovery_code(user_id, used_at);

CREATE TABLE IF NOT EXISTS admin_resource_nodes (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) BETWEEN 1 AND 128),
  kind TEXT NOT NULL CHECK (kind IN ('folder', 'document')),
  parent_id TEXT REFERENCES admin_resource_nodes(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  normalized_name TEXT NOT NULL CHECK (length(normalized_name) > 0),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  trash_root_id TEXT REFERENCES admin_resource_nodes(id) ON DELETE RESTRICT,
  created_by TEXT NOT NULL REFERENCES admin_user(id) ON DELETE RESTRICT,
  updated_by TEXT NOT NULL REFERENCES admin_user(id) ON DELETE RESTRICT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (
    (status = 'active' AND trash_root_id IS NULL) OR
    (status = 'archived' AND trash_root_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_resource_nodes_active_root_name_uq
ON admin_resource_nodes(normalized_name)
WHERE status = 'active' AND parent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS admin_resource_nodes_active_child_name_uq
ON admin_resource_nodes(parent_id, normalized_name)
WHERE status = 'active' AND parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS admin_resource_nodes_parent_sort_idx
ON admin_resource_nodes(parent_id, sort_order, id);

CREATE INDEX IF NOT EXISTS admin_resource_nodes_trash_root_idx
ON admin_resource_nodes(trash_root_id, sort_order, id);

CREATE TRIGGER IF NOT EXISTS admin_resource_nodes_parent_folder_insert
BEFORE INSERT ON admin_resource_nodes
WHEN NEW.parent_id IS NOT NULL AND (
  SELECT kind FROM admin_resource_nodes WHERE id = NEW.parent_id
) <> 'folder'
BEGIN
  SELECT RAISE(ABORT, '자료 node의 부모는 폴더여야 합니다.');
END;

CREATE TRIGGER IF NOT EXISTS admin_resource_nodes_parent_folder_update
BEFORE UPDATE OF parent_id ON admin_resource_nodes
WHEN NEW.parent_id IS NOT NULL AND (
  SELECT kind FROM admin_resource_nodes WHERE id = NEW.parent_id
) <> 'folder'
BEGIN
  SELECT RAISE(ABORT, '자료 node의 부모는 폴더여야 합니다.');
END;

CREATE TABLE IF NOT EXISTS admin_resource_documents (
  node_id TEXT PRIMARY KEY NOT NULL
    REFERENCES admin_resource_nodes(id) ON DELETE CASCADE,
  content_markdown TEXT NOT NULL DEFAULT '' CHECK (length(content_markdown) <= 200000),
  content_revision INTEGER NOT NULL DEFAULT 0 CHECK (content_revision >= 0)
);

CREATE TRIGGER IF NOT EXISTS admin_resource_documents_kind_insert
BEFORE INSERT ON admin_resource_documents
WHEN (
  SELECT kind FROM admin_resource_nodes WHERE id = NEW.node_id
) <> 'document'
BEGIN
  SELECT RAISE(ABORT, '문서 node만 본문을 가질 수 있습니다.');
END;

CREATE TRIGGER IF NOT EXISTS admin_resource_nodes_document_kind_update
BEFORE UPDATE OF kind ON admin_resource_nodes
WHEN NEW.kind <> 'document' AND EXISTS (
  SELECT 1 FROM admin_resource_documents WHERE node_id = NEW.id
)
BEGIN
  SELECT RAISE(ABORT, '본문이 있는 node의 종류를 변경할 수 없습니다.');
END;

CREATE TABLE IF NOT EXISTS admin_resource_collaboration (
  document_id TEXT PRIMARY KEY NOT NULL
    REFERENCES admin_resource_documents(node_id) ON DELETE CASCADE,
  yjs_state BLOB NOT NULL CHECK (length(yjs_state) <= 3000000),
  state_version INTEGER NOT NULL DEFAULT 0 CHECK (state_version >= 0),
  projected_at INTEGER
);

CREATE TABLE IF NOT EXISTS admin_resource_collaboration_updates (
  document_id TEXT NOT NULL
    REFERENCES admin_resource_documents(node_id) ON DELETE CASCADE,
  state_version INTEGER NOT NULL CHECK (state_version > 0),
  content_revision INTEGER NOT NULL CHECK (content_revision > 0),
  transaction_id TEXT NOT NULL CHECK (length(transaction_id) BETWEEN 1 AND 128),
  actor_id TEXT NOT NULL REFERENCES admin_user(id) ON DELETE RESTRICT,
  yjs_update BLOB NOT NULL CHECK (length(yjs_update) <= 524288),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (document_id, state_version),
  UNIQUE (document_id, transaction_id)
);

CREATE TABLE IF NOT EXISTS admin_resource_collaboration_transactions (
  document_id TEXT NOT NULL
    REFERENCES admin_resource_documents(node_id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL CHECK (length(transaction_id) BETWEEN 1 AND 128),
  state_version INTEGER NOT NULL CHECK (state_version > 0),
  content_revision INTEGER NOT NULL CHECK (content_revision > 0),
  actor_id TEXT NOT NULL REFERENCES admin_user(id) ON DELETE RESTRICT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (document_id, transaction_id)
);

CREATE TABLE IF NOT EXISTS admin_resource_audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  node_id TEXT NOT NULL REFERENCES admin_resource_nodes(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('create', 'import', 'move', 'rename', 'reorder', 'restore', 'trash')
  ),
  actor_id TEXT NOT NULL REFERENCES admin_user(id) ON DELETE RESTRICT,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_resource_audit_events_node_created_idx
ON admin_resource_audit_events(node_id, created_at);

CREATE TABLE IF NOT EXISTS admin_resource_tree_state (
  singleton_id INTEGER PRIMARY KEY NOT NULL DEFAULT 1 CHECK (singleton_id = 1),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO admin_resource_tree_state (
  singleton_id,
  revision,
  updated_at
) VALUES (1, 0, 0);

CREATE VIRTUAL TABLE IF NOT EXISTS admin_resource_search USING fts5(
  node_id UNINDEXED,
  kind UNINDEXED,
  name,
  body_text,
  tokenize = 'unicode61'
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

CREATE INDEX IF NOT EXISTS admin_ai_chat_conversations_admin_updated_idx
ON admin_ai_chat_conversations(admin_id, updated_at);

CREATE INDEX IF NOT EXISTS admin_ai_chat_messages_conversation_created_idx
ON admin_ai_chat_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  visual_key TEXT NOT NULL DEFAULT 'basic-sentence-writing',
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL,
  curriculum_revision INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS course_units (
  id TEXT PRIMARY KEY NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  unit_id TEXT NOT NULL REFERENCES course_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  estimated_minutes INTEGER NOT NULL,
  summary_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS lesson_steps (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  content_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS learner_profiles (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  display_name TEXT,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS learner_activity_days (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  activity_date TEXT NOT NULL,
  first_activity_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  saved_answers INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, activity_date)
);

CREATE TABLE IF NOT EXISTS learner_lesson_progress (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  current_step_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS learner_lesson_answers (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL REFERENCES lesson_steps(id) ON DELETE CASCADE,
  answer_json TEXT NOT NULL,
  answered_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, step_id)
);

CREATE TABLE IF NOT EXISTS ai_feedback_attempts (
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

CREATE UNIQUE INDEX IF NOT EXISTS ai_feedback_attempts_idempotency_idx
ON ai_feedback_attempts(user_id, lesson_id, step_id, idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS ai_feedback_attempts_active_slot_idx
ON ai_feedback_attempts(user_id, lesson_id, step_id, attempt_number)
WHERE status IN ('pending', 'succeeded');

CREATE UNIQUE INDEX IF NOT EXISTS ai_feedback_attempts_pending_idx
ON ai_feedback_attempts(user_id, lesson_id, step_id)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS ai_feedback_attempts_expiry_idx
ON ai_feedback_attempts(status, expires_at);
