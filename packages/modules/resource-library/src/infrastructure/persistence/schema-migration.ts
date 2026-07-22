import type { Database } from "bun:sqlite"

const resourceTableNames = [
  "admin_resource_nodes",
  "admin_resource_documents",
  "admin_resource_assets",
] as const

const dropResourceIndexesAndTriggersSql = `
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
`

const createResourceTablesSql = `
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
  content_markdown TEXT NOT NULL DEFAULT '' CHECK (length(content_markdown) <= 200000),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0)
);

CREATE TABLE admin_resource_assets (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL
    REFERENCES admin_resource_documents(node_id) ON DELETE CASCADE,
  r2_object_key TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (
    content_type IN ('image/jpeg', 'image/png', 'image/webp')
  ),
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
`

const createResourceIndexesAndTriggersSql = `
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

CREATE UNIQUE INDEX IF NOT EXISTS admin_resource_assets_object_key_uq
ON admin_resource_assets(r2_object_key);

CREATE INDEX IF NOT EXISTS admin_resource_assets_document_idx
ON admin_resource_assets(document_id, id);

CREATE INDEX IF NOT EXISTS admin_resource_assets_delete_pending_idx
ON admin_resource_assets(status, delete_requested_at, id);

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

CREATE VIRTUAL TABLE IF NOT EXISTS admin_resource_search USING fts5(
  node_id UNINDEXED,
  name,
  body_text,
  tokenize = 'unicode61'
);
`

export function runResourceLibrarySchemaMigration(sqlite: Database): void {
  const existingTables = new Set(
    sqlite
      .query<{ readonly name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table'"
      )
      .all()
      .map(({ name }) => name)
  )
  const existingResourceTableCount = resourceTableNames.filter((table) =>
    existingTables.has(table)
  ).length

  if (existingResourceTableCount === 0) {
    sqlite.exec(
      `${createResourceTablesSql}\n${createResourceIndexesAndTriggersSql}`
    )
    return
  }
  if (existingResourceTableCount !== resourceTableNames.length) {
    throw new Error(
      "resource-library migration prerequisite failed: partial schema"
    )
  }

  assertResourceLibraryMigrationPrerequisites(sqlite)
  if (isCurrentResourceSchema(sqlite)) {
    sqlite.exec(createResourceIndexesAndTriggersSql)
    return
  }

  sqlite.exec("PRAGMA foreign_keys = OFF")
  sqlite.exec("BEGIN IMMEDIATE")
  try {
    sqlite.exec(`
${dropResourceIndexesAndTriggersSql}

ALTER TABLE admin_resource_assets RENAME TO admin_resource_assets_legacy_p8;
ALTER TABLE admin_resource_documents RENAME TO admin_resource_documents_legacy_p8;
ALTER TABLE admin_resource_nodes RENAME TO admin_resource_nodes_legacy_p8;

${createResourceTablesSql}

INSERT INTO admin_resource_nodes (
  id, kind, parent_id, name, normalized_name, status, trash_root_id,
  created_by, updated_by, created_at, updated_at
)
SELECT
  id, kind, parent_id, name, normalized_name, status, trash_root_id,
  created_by, updated_by, created_at, updated_at
FROM admin_resource_nodes_legacy_p8;

INSERT INTO admin_resource_documents (node_id, content_markdown, version)
SELECT node_id, content_markdown, version
FROM admin_resource_documents_legacy_p8;

INSERT INTO admin_resource_assets (
  id, document_id, r2_object_key, content_type, byte_size, alt_text,
  status, delete_root_id, delete_requested_by, delete_requested_at, created_at
)
SELECT
  id, document_id, r2_object_key, content_type, byte_size, '기존 이미지',
  'active', NULL, NULL, NULL, created_at
FROM admin_resource_assets_legacy_p8;

DROP TABLE admin_resource_assets_legacy_p8;
DROP TABLE admin_resource_documents_legacy_p8;
DROP TABLE admin_resource_nodes_legacy_p8;

${createResourceIndexesAndTriggersSql}
`)
    const violation = sqlite
      .query<unknown, []>("PRAGMA foreign_key_check")
      .get()
    if (violation !== null) {
      throw new Error(
        "resource-library migration prerequisite failed: foreign key violation"
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

export function assertResourceLibraryMigrationPrerequisites(
  sqlite: Database
): void {
  assertRequiredColumns(sqlite, "admin_resource_nodes", [
    "created_at",
    "created_by",
    "id",
    "kind",
    "name",
    "normalized_name",
    "parent_id",
    "status",
    "trash_root_id",
    "updated_at",
    "updated_by",
  ])
  assertRequiredColumns(sqlite, "admin_resource_documents", [
    "content_markdown",
    "node_id",
    "version",
  ])
  assertRequiredColumns(sqlite, "admin_resource_assets", [
    "byte_size",
    "content_type",
    "created_at",
    "document_id",
    "id",
    "r2_object_key",
  ])

  const invalidNode = sqlite
    .query<{ readonly id: string }, []>(`
      SELECT id
      FROM admin_resource_nodes
      WHERE id = '' OR created_by = '' OR updated_by = ''
        OR kind NOT IN ('folder', 'document')
        OR status NOT IN ('active', 'trashed')
        OR (status = 'active' AND trash_root_id IS NOT NULL)
        OR (status = 'trashed' AND trash_root_id IS NULL)
      LIMIT 1
    `)
    .get()
  if (invalidNode !== null) {
    throw new Error(
      `resource-library migration prerequisite failed: invalid node ${invalidNode.id}`
    )
  }

  if (hasTable(sqlite, "admin_user")) {
    const unknownActor = sqlite
      .query<{ readonly id: string }, []>(`
        SELECT node.id
        FROM admin_resource_nodes AS node
        LEFT JOIN admin_user AS creator ON creator.id = node.created_by
        LEFT JOIN admin_user AS updater ON updater.id = node.updated_by
        WHERE creator.id IS NULL OR updater.id IS NULL
        LIMIT 1
      `)
      .get()
    if (unknownActor !== null) {
      throw new Error(
        `resource-library migration prerequisite failed: unknown actor for node ${unknownActor.id}`
      )
    }
  }

  const orphanDocument = sqlite
    .query<{ readonly id: string }, []>(`
      SELECT document.node_id AS id
      FROM admin_resource_documents AS document
      LEFT JOIN admin_resource_nodes AS node ON node.id = document.node_id
      WHERE node.id IS NULL OR node.kind <> 'document'
      LIMIT 1
    `)
    .get()
  if (orphanDocument !== null) {
    throw new Error(
      `resource-library migration prerequisite failed: orphan document ${orphanDocument.id}`
    )
  }

  const orphanAsset = sqlite
    .query<{ readonly id: string }, []>(`
      SELECT asset.id
      FROM admin_resource_assets AS asset
      LEFT JOIN admin_resource_documents AS document
        ON document.node_id = asset.document_id
      WHERE document.node_id IS NULL
      LIMIT 1
    `)
    .get()
  if (orphanAsset !== null) {
    throw new Error(
      `resource-library migration prerequisite failed: orphan asset ${orphanAsset.id}`
    )
  }
}

function assertRequiredColumns(
  sqlite: Database,
  tableName: string,
  requiredColumns: readonly string[]
): void {
  const columns = new Set(
    sqlite
      .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
      .all()
      .map(({ name }) => name)
  )
  const missing = requiredColumns.filter((column) => !columns.has(column))
  if (missing.length > 0) {
    throw new Error(
      `resource-library migration prerequisite failed: ${tableName} missing columns ${missing.join(", ")}`
    )
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

function isCurrentResourceSchema(sqlite: Database): boolean {
  const assetColumns = new Set(
    sqlite
      .query<{ readonly name: string }, []>(
        "PRAGMA table_info(admin_resource_assets)"
      )
      .all()
      .map(({ name }) => name)
  )
  const nodeForeignTables = sqlite
    .query<{ readonly table: string }, []>(
      "PRAGMA foreign_key_list(admin_resource_nodes)"
    )
    .all()
    .map((foreignKey) => foreignKey.table)

  return (
    [
      "alt_text",
      "status",
      "delete_root_id",
      "delete_requested_by",
      "delete_requested_at",
    ].every((column) => assetColumns.has(column)) &&
    nodeForeignTables.every((table) => table === "admin_resource_nodes")
  )
}
