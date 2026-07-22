-- Auth-owned rate-limit state was introduced after the immutable baseline.
CREATE TABLE auth_rate_limit (
  key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL,
  last_request INTEGER NOT NULL
);

CREATE TABLE admin_auth_rate_limit (
  key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL,
  last_request INTEGER NOT NULL
);

-- Identity references auth IDs as values instead of cross-module foreign keys.
ALTER TABLE learner_profiles RENAME TO learner_profiles_legacy_p11;

CREATE TABLE learner_profiles (
  user_id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),
  display_name TEXT,
  deleted_at INTEGER,
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0)
);

INSERT INTO learner_profiles (
  user_id, status, display_name, deleted_at, version
)
SELECT user_id, status, display_name, deleted_at, 0
FROM learner_profiles_legacy_p11;

DROP TABLE learner_profiles_legacy_p11;

CREATE TABLE admin_identity_profiles (
  admin_id TEXT PRIMARY KEY NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('owner', 'operator')),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0)
);

INSERT INTO admin_identity_profiles (admin_id, role, version)
SELECT
  id,
  CASE WHEN role = 'owner' THEN 'owner' ELSE 'operator' END,
  0
FROM admin_user;

-- Learning keeps only aggregate-internal foreign keys.
DROP INDEX IF EXISTS learner_course_progress_activity_idx;
DROP INDEX IF EXISTS learner_lesson_progress_user_course_idx;
DROP INDEX IF EXISTS learner_lesson_answers_lesson_idx;

ALTER TABLE learner_lesson_answers
  RENAME TO learner_lesson_answers_legacy_p11;
ALTER TABLE learner_lesson_progress
  RENAME TO learner_lesson_progress_legacy_p11;
ALTER TABLE learner_course_progress
  RENAME TO learner_course_progress_legacy_p11;
ALTER TABLE learner_activity_days
  RENAME TO learner_activity_days_legacy_p11;

CREATE TABLE learner_activity_days (
  user_id TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  first_activity_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  completed_lessons INTEGER NOT NULL DEFAULT 0 CHECK (completed_lessons >= 0),
  saved_answers INTEGER NOT NULL DEFAULT 0 CHECK (saved_answers >= 0),
  PRIMARY KEY (user_id, activity_date)
);

CREATE TABLE learner_course_progress (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  curriculum_version_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  last_activity_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, course_id)
);

CREATE UNIQUE INDEX learner_course_progress_version_scope_idx
ON learner_course_progress(user_id, course_id, curriculum_version_id);

CREATE INDEX learner_course_progress_activity_idx
ON learner_course_progress(user_id, last_activity_at, course_id);

CREATE TABLE learner_lesson_progress (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  curriculum_version_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  current_step_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, curriculum_version_id, lesson_id),
  CONSTRAINT learner_lesson_progress_course_progress_fk
    FOREIGN KEY (user_id, course_id, curriculum_version_id)
    REFERENCES learner_course_progress(user_id, course_id, curriculum_version_id)
    ON DELETE CASCADE
);

CREATE INDEX learner_lesson_progress_user_course_idx
ON learner_lesson_progress(user_id, course_id);

CREATE TABLE learner_lesson_answers (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  curriculum_version_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  answer_json TEXT NOT NULL,
  answered_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, curriculum_version_id, step_id),
  CONSTRAINT learner_lesson_answers_course_progress_fk
    FOREIGN KEY (user_id, course_id, curriculum_version_id)
    REFERENCES learner_course_progress(user_id, course_id, curriculum_version_id)
    ON DELETE CASCADE
);

CREATE INDEX learner_lesson_answers_lesson_idx
ON learner_lesson_answers(user_id, curriculum_version_id, lesson_id);

INSERT INTO learner_activity_days (
  user_id, activity_date, first_activity_at, last_activity_at,
  completed_lessons, saved_answers
)
SELECT
  user_id, activity_date, first_activity_at, last_activity_at,
  completed_lessons, saved_answers
FROM learner_activity_days_legacy_p11;

INSERT INTO learner_course_progress (
  user_id, course_id, curriculum_version_id, status, started_at,
  completed_at, last_activity_at, updated_at
)
SELECT
  user_id, course_id, curriculum_version_id, status, started_at,
  completed_at, last_activity_at, updated_at
FROM learner_course_progress_legacy_p11;

INSERT INTO learner_lesson_progress (
  user_id, course_id, curriculum_version_id, lesson_id, current_step_id,
  status, started_at, completed_at, updated_at
)
SELECT
  user_id, course_id, curriculum_version_id, lesson_id, current_step_id,
  status, started_at, completed_at, updated_at
FROM learner_lesson_progress_legacy_p11;

INSERT INTO learner_lesson_answers (
  user_id, course_id, curriculum_version_id, lesson_id, step_id,
  answer_json, answered_at, updated_at
)
SELECT
  user_id, course_id, curriculum_version_id, lesson_id, step_id,
  answer_json, answered_at, updated_at
FROM learner_lesson_answers_legacy_p11;

DROP TABLE learner_lesson_answers_legacy_p11;
DROP TABLE learner_lesson_progress_legacy_p11;
DROP TABLE learner_course_progress_legacy_p11;
DROP TABLE learner_activity_days_legacy_p11;

-- AI feedback owns reference values but no foreign keys to auth, content, or learning.
DROP INDEX IF EXISTS ai_feedback_attempts_idempotency_idx;
DROP INDEX IF EXISTS ai_feedback_attempts_active_slot_idx;
DROP INDEX IF EXISTS ai_feedback_attempts_pending_idx;
DROP INDEX IF EXISTS ai_feedback_attempts_expiry_idx;

ALTER TABLE ai_feedback_attempts RENAME TO ai_feedback_attempts_legacy_p11;

CREATE TABLE ai_feedback_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  curriculum_version_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('pending', 'succeeded', 'failed', 'expired')),
  answer_text TEXT NOT NULL,
  result_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

INSERT INTO ai_feedback_attempts (
  id, user_id, course_id, curriculum_version_id, lesson_id, step_id,
  attempt_number, idempotency_key, status, answer_text, result_json,
  created_at, updated_at, expires_at
)
SELECT
  id, user_id, course_id, curriculum_version_id, lesson_id, step_id,
  attempt_number, idempotency_key, status, answer_text, result_json,
  created_at, updated_at, expires_at
FROM ai_feedback_attempts_legacy_p11;

DROP TABLE ai_feedback_attempts_legacy_p11;

CREATE UNIQUE INDEX ai_feedback_attempts_idempotency_idx
ON ai_feedback_attempts(
  user_id, curriculum_version_id, lesson_id, step_id, idempotency_key
);

CREATE UNIQUE INDEX ai_feedback_attempts_active_slot_idx
ON ai_feedback_attempts(
  user_id, curriculum_version_id, lesson_id, step_id, attempt_number
)
WHERE status IN ('pending', 'succeeded');

CREATE UNIQUE INDEX ai_feedback_attempts_pending_idx
ON ai_feedback_attempts(user_id, curriculum_version_id, lesson_id, step_id)
WHERE status = 'pending';

CREATE INDEX ai_feedback_attempts_expiry_idx
ON ai_feedback_attempts(status, expires_at);

-- Resource Library removes auth FKs and adds the asset lifecycle columns.
DROP INDEX IF EXISTS admin_resource_nodes_active_root_name_uq;
DROP INDEX IF EXISTS admin_resource_nodes_active_child_name_uq;
DROP INDEX IF EXISTS admin_resource_nodes_parent_name_idx;
DROP INDEX IF EXISTS admin_resource_nodes_trash_root_idx;
DROP INDEX IF EXISTS admin_resource_assets_object_key_uq;
DROP INDEX IF EXISTS admin_resource_assets_document_idx;
DROP INDEX IF EXISTS admin_resource_assets_delete_pending_idx;
DROP TRIGGER IF EXISTS admin_resource_nodes_parent_folder_insert;
DROP TRIGGER IF EXISTS admin_resource_nodes_parent_folder_update;
DROP TRIGGER IF EXISTS admin_resource_documents_kind_insert;
DROP TRIGGER IF EXISTS admin_resource_nodes_document_kind_update;

ALTER TABLE admin_resource_assets
  RENAME TO admin_resource_assets_legacy_p11;
ALTER TABLE admin_resource_documents
  RENAME TO admin_resource_documents_legacy_p11;
ALTER TABLE admin_resource_nodes
  RENAME TO admin_resource_nodes_legacy_p11;

CREATE TABLE admin_resource_nodes (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) BETWEEN 1 AND 128),
  kind TEXT NOT NULL CHECK (kind IN ('folder', 'document')),
  parent_id TEXT REFERENCES admin_resource_nodes(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  normalized_name TEXT NOT NULL CHECK (length(normalized_name) > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trashed')),
  trash_root_id TEXT REFERENCES admin_resource_nodes(id) ON DELETE RESTRICT,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (
    (status = 'active' AND trash_root_id IS NULL) OR
    (status = 'trashed' AND trash_root_id IS NOT NULL)
  )
);

CREATE TABLE admin_resource_documents (
  node_id TEXT PRIMARY KEY NOT NULL
    REFERENCES admin_resource_nodes(id) ON DELETE CASCADE,
  content_markdown TEXT NOT NULL DEFAULT ''
    CHECK (length(content_markdown) <= 200000),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0)
);

CREATE TABLE admin_resource_assets (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL
    REFERENCES admin_resource_documents(node_id) ON DELETE CASCADE,
  r2_object_key TEXT NOT NULL,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_size INTEGER NOT NULL CHECK (byte_size BETWEEN 1 AND 5242880),
  alt_text TEXT NOT NULL CHECK (length(trim(alt_text)) BETWEEN 1 AND 500),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'delete-pending')),
  delete_root_id TEXT REFERENCES admin_resource_nodes(id) ON DELETE RESTRICT,
  delete_requested_by TEXT,
  delete_requested_at INTEGER,
  created_at INTEGER NOT NULL,
  CHECK (
    (status = 'active' AND delete_root_id IS NULL
      AND delete_requested_by IS NULL AND delete_requested_at IS NULL) OR
    (status = 'delete-pending' AND delete_root_id IS NOT NULL
      AND delete_requested_by IS NOT NULL AND delete_requested_at IS NOT NULL)
  )
);

INSERT INTO admin_resource_nodes (
  id, kind, parent_id, name, normalized_name, status, trash_root_id,
  created_by, updated_by, created_at, updated_at
)
SELECT
  id, kind, parent_id, name, normalized_name, status, trash_root_id,
  created_by, updated_by, created_at, updated_at
FROM admin_resource_nodes_legacy_p11;

INSERT INTO admin_resource_documents (node_id, content_markdown, version)
SELECT node_id, content_markdown, version
FROM admin_resource_documents_legacy_p11;

INSERT INTO admin_resource_assets (
  id, document_id, r2_object_key, content_type, byte_size, alt_text,
  status, delete_root_id, delete_requested_by, delete_requested_at, created_at
)
SELECT
  id, document_id, r2_object_key, content_type, byte_size, '기존 이미지',
  'active', NULL, NULL, NULL, created_at
FROM admin_resource_assets_legacy_p11;

DROP TABLE admin_resource_assets_legacy_p11;
DROP TABLE admin_resource_documents_legacy_p11;
DROP TABLE admin_resource_nodes_legacy_p11;

CREATE UNIQUE INDEX admin_resource_nodes_active_root_name_uq
ON admin_resource_nodes(normalized_name)
WHERE status = 'active' AND parent_id IS NULL;

CREATE UNIQUE INDEX admin_resource_nodes_active_child_name_uq
ON admin_resource_nodes(parent_id, normalized_name)
WHERE status = 'active' AND parent_id IS NOT NULL;

CREATE INDEX admin_resource_nodes_parent_name_idx
ON admin_resource_nodes(parent_id, normalized_name, id);

CREATE INDEX admin_resource_nodes_trash_root_idx
ON admin_resource_nodes(trash_root_id, normalized_name, id);

CREATE UNIQUE INDEX admin_resource_assets_object_key_uq
ON admin_resource_assets(r2_object_key);

CREATE INDEX admin_resource_assets_document_idx
ON admin_resource_assets(document_id, id);

CREATE INDEX admin_resource_assets_delete_pending_idx
ON admin_resource_assets(status, delete_requested_at, id);

CREATE TRIGGER admin_resource_nodes_parent_folder_insert
BEFORE INSERT ON admin_resource_nodes
WHEN NEW.parent_id IS NOT NULL AND (
  SELECT kind FROM admin_resource_nodes WHERE id = NEW.parent_id
) <> 'folder'
BEGIN
  SELECT RAISE(ABORT, '자료 node의 부모는 폴더여야 합니다.');
END;

CREATE TRIGGER admin_resource_nodes_parent_folder_update
BEFORE UPDATE OF parent_id ON admin_resource_nodes
WHEN NEW.parent_id IS NOT NULL AND (
  SELECT kind FROM admin_resource_nodes WHERE id = NEW.parent_id
) <> 'folder'
BEGIN
  SELECT RAISE(ABORT, '자료 node의 부모는 폴더여야 합니다.');
END;

CREATE TRIGGER admin_resource_documents_kind_insert
BEFORE INSERT ON admin_resource_documents
WHEN (
  SELECT kind FROM admin_resource_nodes WHERE id = NEW.node_id
) <> 'document'
BEGIN
  SELECT RAISE(ABORT, '문서 node만 본문을 가질 수 있습니다.');
END;

CREATE TRIGGER admin_resource_nodes_document_kind_update
BEFORE UPDATE OF kind ON admin_resource_nodes
WHEN NEW.kind <> 'document' AND EXISTS (
  SELECT 1 FROM admin_resource_documents WHERE node_id = NEW.id
)
BEGIN
  SELECT RAISE(ABORT, '본문이 있는 node의 종류를 변경할 수 없습니다.');
END;

-- Operations references admin IDs as values and keeps conversation-local FKs.
DROP INDEX IF EXISTS admin_ai_chat_conversations_admin_updated_idx;
DROP INDEX IF EXISTS admin_ai_chat_messages_conversation_created_idx;

ALTER TABLE admin_ai_chat_messages
  RENAME TO admin_ai_chat_messages_legacy_p11;
ALTER TABLE admin_ai_chat_conversations
  RENAME TO admin_ai_chat_conversations_legacy_p11;

CREATE TABLE admin_ai_chat_conversations (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE admin_ai_chat_messages (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL
    REFERENCES admin_ai_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('assistant', 'user')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

INSERT INTO admin_ai_chat_conversations (
  id, title, admin_id, created_at, updated_at
)
SELECT id, title, admin_id, created_at, updated_at
FROM admin_ai_chat_conversations_legacy_p11;

INSERT INTO admin_ai_chat_messages (
  id, conversation_id, role, content, created_at
)
SELECT id, conversation_id, role, content, created_at
FROM admin_ai_chat_messages_legacy_p11;

DROP TABLE admin_ai_chat_messages_legacy_p11;
DROP TABLE admin_ai_chat_conversations_legacy_p11;

CREATE INDEX admin_ai_chat_conversations_admin_updated_idx
ON admin_ai_chat_conversations(admin_id, updated_at);

CREATE INDEX admin_ai_chat_messages_conversation_created_idx
ON admin_ai_chat_messages(conversation_id, created_at);

CREATE TABLE operations_ai_quota_counters (
  key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL CHECK (count >= 0),
  reset_at INTEGER NOT NULL
);

CREATE INDEX operations_ai_quota_reset_idx
ON operations_ai_quota_counters(reset_at);

CREATE TABLE operations_ai_change_proposals (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL
    REFERENCES admin_ai_chat_conversations(id) ON DELETE CASCADE,
  created_by_admin_id TEXT NOT NULL,
  change_json TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('proposed', 'applying', 'approved', 'rejected')),
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  reviewed_by_admin_id TEXT
);

CREATE INDEX operations_ai_change_proposals_conversation_idx
ON operations_ai_change_proposals(conversation_id, created_at);

-- Product role ownership has moved to identity; credentials retain no role column.
ALTER TABLE admin_user DROP COLUMN role;
