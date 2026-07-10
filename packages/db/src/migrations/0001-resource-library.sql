CREATE TABLE IF NOT EXISTS admin_resource_nodes (
  id TEXT PRIMARY KEY NOT NULL,
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
  yjs_state BLOB NOT NULL,
  state_version INTEGER NOT NULL DEFAULT 0 CHECK (state_version >= 0),
  projected_at INTEGER
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
