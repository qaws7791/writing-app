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

CREATE TABLE IF NOT EXISTS admin_resource_nodes (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) BETWEEN 1 AND 128),
  kind TEXT NOT NULL CHECK (kind IN ('folder', 'document')),
  parent_id TEXT REFERENCES admin_resource_nodes(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  normalized_name TEXT NOT NULL CHECK (length(normalized_name) > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trashed')),
  trash_root_id TEXT REFERENCES admin_resource_nodes(id) ON DELETE RESTRICT,
  created_by TEXT NOT NULL REFERENCES admin_user(id) ON DELETE RESTRICT,
  updated_by TEXT NOT NULL REFERENCES admin_user(id) ON DELETE RESTRICT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (
    (status = 'active' AND trash_root_id IS NULL) OR
    (status = 'trashed' AND trash_root_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_resource_nodes_active_root_name_uq
ON admin_resource_nodes(normalized_name)
WHERE status = 'active' AND parent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS admin_resource_nodes_active_child_name_uq
ON admin_resource_nodes(parent_id, normalized_name)
WHERE status = 'active' AND parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS admin_resource_nodes_parent_name_idx
ON admin_resource_nodes(parent_id, normalized_name, id);

CREATE INDEX IF NOT EXISTS admin_resource_nodes_trash_root_idx
ON admin_resource_nodes(trash_root_id, normalized_name, id);

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
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0)
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

CREATE TABLE IF NOT EXISTS admin_resource_assets (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL
    REFERENCES admin_resource_documents(node_id) ON DELETE CASCADE,
  r2_object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (
    content_type IN ('image/jpeg', 'image/png', 'image/webp')
  ),
  byte_size INTEGER NOT NULL CHECK (byte_size BETWEEN 1 AND 5242880),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_resource_assets_document_idx
ON admin_resource_assets(document_id, id);

CREATE VIRTUAL TABLE IF NOT EXISTS admin_resource_search USING fts5(
  node_id UNINDEXED,
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
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  published_curriculum_version_id TEXT REFERENCES course_curriculum_versions(id) ON DELETE RESTRICT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS course_curriculum_versions (
  id TEXT PRIMARY KEY NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision > 0),
  edit_version INTEGER NOT NULL DEFAULT 0 CHECK (edit_version >= 0),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  visual_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER,
  CHECK (
    (status = 'published' AND published_at IS NOT NULL)
    OR (status = 'draft' AND published_at IS NULL)
  ),
  UNIQUE (course_id, revision),
  UNIQUE (course_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS course_curriculum_versions_single_draft_idx
ON course_curriculum_versions(course_id)
WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS course_curriculum_versions_course_status_idx
ON course_curriculum_versions(course_id, status);

CREATE TABLE IF NOT EXISTS course_unit_versions (
  curriculum_version_id TEXT NOT NULL REFERENCES course_curriculum_versions(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  PRIMARY KEY (curriculum_version_id, id),
  UNIQUE (curriculum_version_id, sort_order)
);

CREATE TABLE IF NOT EXISTS lesson_versions (
  curriculum_version_id TEXT NOT NULL REFERENCES course_curriculum_versions(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes > 0),
  summary_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  PRIMARY KEY (curriculum_version_id, id),
  UNIQUE (curriculum_version_id, unit_id, sort_order),
  UNIQUE (curriculum_version_id, id),
  FOREIGN KEY (curriculum_version_id, unit_id)
    REFERENCES course_unit_versions(curriculum_version_id, id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_step_versions (
  curriculum_version_id TEXT NOT NULL REFERENCES course_curriculum_versions(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  type TEXT NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  content_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  PRIMARY KEY (curriculum_version_id, id),
  UNIQUE (curriculum_version_id, lesson_id, sort_order),
  UNIQUE (curriculum_version_id, lesson_id, id),
  FOREIGN KEY (curriculum_version_id, lesson_id)
    REFERENCES lesson_versions(curriculum_version_id, id)
    ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS course_unit_versions_published_insert_guard
BEFORE INSERT ON course_unit_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS course_unit_versions_published_update_guard
BEFORE UPDATE ON course_unit_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id IN (OLD.curriculum_version_id, NEW.curriculum_version_id)
    AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS course_unit_versions_published_delete_guard
BEFORE DELETE ON course_unit_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_versions_published_insert_guard
BEFORE INSERT ON lesson_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_versions_published_update_guard
BEFORE UPDATE ON lesson_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id IN (OLD.curriculum_version_id, NEW.curriculum_version_id)
    AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_versions_published_delete_guard
BEFORE DELETE ON lesson_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_step_versions_published_insert_guard
BEFORE INSERT ON lesson_step_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_step_versions_published_update_guard
BEFORE UPDATE ON lesson_step_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id IN (OLD.curriculum_version_id, NEW.curriculum_version_id)
    AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS lesson_step_versions_published_delete_guard
BEFORE DELETE ON lesson_step_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER IF NOT EXISTS courses_published_version_insert_check
BEFORE INSERT ON courses
WHEN NEW.published_curriculum_version_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
    FROM course_curriculum_versions version
    WHERE version.id = NEW.published_curriculum_version_id
      AND version.course_id = NEW.id
      AND version.status = 'published'
  ) THEN RAISE(ABORT, 'published curriculum version must belong to the course and be published') END;
END;

CREATE TRIGGER IF NOT EXISTS courses_published_version_update_check
BEFORE UPDATE OF published_curriculum_version_id ON courses
WHEN NEW.published_curriculum_version_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
    FROM course_curriculum_versions version
    WHERE version.id = NEW.published_curriculum_version_id
      AND version.course_id = NEW.id
      AND version.status = 'published'
  ) THEN RAISE(ABORT, 'published curriculum version must belong to the course and be published') END;
END;

CREATE TRIGGER IF NOT EXISTS course_curriculum_versions_published_update_guard
BEFORE UPDATE ON course_curriculum_versions
WHEN OLD.status = 'published'
BEGIN
  SELECT RAISE(ABORT, 'published curriculum version is immutable');
END;

CREATE TRIGGER IF NOT EXISTS course_curriculum_versions_published_delete_guard
BEFORE DELETE ON course_curriculum_versions
WHEN OLD.status = 'published'
BEGIN
  SELECT RAISE(ABORT, 'published curriculum version is immutable');
END;

CREATE TABLE IF NOT EXISTS learner_profiles (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  display_name TEXT,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS learner_activity_days (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  activity_date TEXT NOT NULL,
  first_activity_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  completed_lessons INTEGER NOT NULL DEFAULT 0 CHECK (completed_lessons >= 0),
  saved_answers INTEGER NOT NULL DEFAULT 0 CHECK (saved_answers >= 0),
  PRIMARY KEY (user_id, activity_date)
);

CREATE TABLE IF NOT EXISTS learner_course_progress (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  curriculum_version_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  last_activity_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, course_id),
  UNIQUE (user_id, course_id, curriculum_version_id),
  FOREIGN KEY (course_id, curriculum_version_id)
    REFERENCES course_curriculum_versions(course_id, id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS learner_course_progress_activity_idx
ON learner_course_progress(user_id, last_activity_at, course_id);

CREATE TABLE IF NOT EXISTS learner_lesson_progress (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  curriculum_version_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  current_step_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, curriculum_version_id, lesson_id),
  FOREIGN KEY (user_id, course_id, curriculum_version_id)
    REFERENCES learner_course_progress(user_id, course_id, curriculum_version_id)
    ON DELETE CASCADE,
  FOREIGN KEY (curriculum_version_id, lesson_id)
    REFERENCES lesson_versions(curriculum_version_id, id)
    ON DELETE RESTRICT,
  FOREIGN KEY (curriculum_version_id, lesson_id, current_step_id)
    REFERENCES lesson_step_versions(curriculum_version_id, lesson_id, id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS learner_lesson_progress_user_course_idx
ON learner_lesson_progress(user_id, course_id);

CREATE TABLE IF NOT EXISTS learner_lesson_answers (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  curriculum_version_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  answer_json TEXT NOT NULL,
  answered_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, curriculum_version_id, step_id),
  FOREIGN KEY (user_id, course_id, curriculum_version_id)
    REFERENCES learner_course_progress(user_id, course_id, curriculum_version_id)
    ON DELETE CASCADE,
  FOREIGN KEY (curriculum_version_id, lesson_id, step_id)
    REFERENCES lesson_step_versions(curriculum_version_id, lesson_id, id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS learner_lesson_answers_lesson_idx
ON learner_lesson_answers(user_id, curriculum_version_id, lesson_id);

CREATE TABLE IF NOT EXISTS ai_feedback_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  curriculum_version_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'expired')),
  answer_text TEXT NOT NULL,
  result_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id, course_id, curriculum_version_id)
    REFERENCES learner_course_progress(user_id, course_id, curriculum_version_id)
    ON DELETE CASCADE,
  FOREIGN KEY (curriculum_version_id, lesson_id, step_id)
    REFERENCES lesson_step_versions(curriculum_version_id, lesson_id, id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_feedback_attempts_idempotency_idx
ON ai_feedback_attempts(user_id, curriculum_version_id, lesson_id, step_id, idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS ai_feedback_attempts_active_slot_idx
ON ai_feedback_attempts(user_id, curriculum_version_id, lesson_id, step_id, attempt_number)
WHERE status IN ('pending', 'succeeded');

CREATE UNIQUE INDEX IF NOT EXISTS ai_feedback_attempts_pending_idx
ON ai_feedback_attempts(user_id, curriculum_version_id, lesson_id, step_id)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS ai_feedback_attempts_expiry_idx
ON ai_feedback_attempts(status, expires_at);
