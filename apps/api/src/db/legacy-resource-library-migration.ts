import type { Database } from "bun:sqlite"

const legacyNodeColumns = [
  "created_at",
  "created_by",
  "id",
  "kind",
  "name",
  "normalized_name",
  "parent_id",
  "sort_order",
  "status",
  "trash_root_id",
  "updated_at",
  "updated_by",
] as const
const legacyDocumentColumns = [
  "content_markdown",
  "content_revision",
  "node_id",
] as const
const legacySearchColumns = ["body_text", "kind", "name", "node_id"] as const
const currentNodeColumns = legacyNodeColumns.filter(
  (column) => column !== "sort_order"
)
const currentDocumentColumns = [
  "content_markdown",
  "node_id",
  "version",
] as const
const baselineAssetColumns = [
  "byte_size",
  "content_type",
  "created_at",
  "document_id",
  "id",
  "r2_object_key",
] as const
const currentAssetColumns = [
  ...baselineAssetColumns,
  "alt_text",
  "delete_requested_at",
  "delete_requested_by",
  "delete_root_id",
  "status",
] as const
const currentSearchColumns = ["body_text", "name", "node_id"] as const

type ResourceSchemaState = "absent" | "current" | "known-legacy"

export function assertLegacyResourceLibraryMigrationPrerequisites(
  sqlite: Database
): void {
  const state = readResourceSchemaState(sqlite)
  if (state === "known-legacy") validateKnownLegacyResourceRows(sqlite)
}

export function prepareLegacyResourceLibraryState(sqlite: Database): void {
  const state = readResourceSchemaState(sqlite)
  if (state !== "known-legacy") return

  validateKnownLegacyResourceRows(sqlite)
  const before = readPreservedCounts(sqlite, "content_revision")

  sqlite.exec(`
    DROP TRIGGER IF EXISTS admin_resource_documents_kind_insert;
    DROP TRIGGER IF EXISTS admin_resource_nodes_document_kind_update;

    DROP TABLE IF EXISTS admin_resource_collaboration_transactions;
    DROP TABLE IF EXISTS admin_resource_collaboration_updates;
    DROP TABLE IF EXISTS admin_resource_collaboration;
    DROP TABLE IF EXISTS admin_resource_audit_events;
    DROP TABLE IF EXISTS admin_resource_tree_state;

    ALTER TABLE admin_resource_documents
      RENAME TO admin_resource_documents_legacy_state;

    ALTER TABLE admin_resource_nodes
      RENAME TO admin_resource_nodes_legacy_state;

    CREATE TABLE admin_resource_nodes (
      id TEXT PRIMARY KEY NOT NULL
        CHECK (length(id) BETWEEN 1 AND 128),
      kind TEXT NOT NULL CHECK (kind IN ('folder', 'document')),
      parent_id TEXT
        REFERENCES admin_resource_nodes(id) ON DELETE RESTRICT,
      name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
      normalized_name TEXT NOT NULL CHECK (length(normalized_name) > 0),
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'trashed')),
      trash_root_id TEXT
        REFERENCES admin_resource_nodes(id) ON DELETE RESTRICT,
      created_by TEXT NOT NULL
        REFERENCES admin_user(id) ON DELETE RESTRICT,
      updated_by TEXT NOT NULL
        REFERENCES admin_user(id) ON DELETE RESTRICT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      CHECK (
        (status = 'active' AND trash_root_id IS NULL) OR
        (status = 'trashed' AND trash_root_id IS NOT NULL)
      )
    );

    INSERT INTO admin_resource_nodes (
      id, kind, parent_id, name, normalized_name, status, trash_root_id,
      created_by, updated_by, created_at, updated_at
    )
    SELECT
      id, kind, parent_id, name, normalized_name,
      CASE status WHEN 'archived' THEN 'trashed' ELSE status END,
      trash_root_id, created_by, updated_by, created_at, updated_at
    FROM admin_resource_nodes_legacy_state;

    CREATE TABLE admin_resource_documents (
      node_id TEXT PRIMARY KEY NOT NULL
        REFERENCES admin_resource_nodes(id) ON DELETE CASCADE,
      content_markdown TEXT NOT NULL DEFAULT ''
        CHECK (length(content_markdown) <= 200000),
      version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0)
    );

    INSERT INTO admin_resource_documents (
      node_id, content_markdown, version
    )
    SELECT node_id, content_markdown, content_revision
    FROM admin_resource_documents_legacy_state;

    DROP TABLE admin_resource_documents_legacy_state;
    DROP TABLE admin_resource_nodes_legacy_state;

    CREATE TABLE admin_resource_assets (
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

    CREATE INDEX admin_resource_assets_document_idx
    ON admin_resource_assets(document_id, id);

    CREATE TABLE admin_resource_search_legacy_rows (
      legacy_rowid INTEGER PRIMARY KEY,
      node_id TEXT,
      name TEXT,
      body_text TEXT
    );

    INSERT INTO admin_resource_search_legacy_rows (
      legacy_rowid, node_id, name, body_text
    )
    SELECT rowid, node_id, name, body_text
    FROM admin_resource_search;

    DROP TABLE admin_resource_search;

    CREATE VIRTUAL TABLE admin_resource_search USING fts5(
      node_id UNINDEXED,
      name,
      body_text,
      tokenize = 'unicode61'
    );

    INSERT INTO admin_resource_search (node_id, name, body_text)
    SELECT node_id, name, body_text
    FROM admin_resource_search_legacy_rows
    ORDER BY legacy_rowid;

    DROP TABLE admin_resource_search_legacy_rows;
  `)

  if (readResourceSchemaState(sqlite) !== "current") {
    throw new Error("legacy resource-library schema normalization failed")
  }
  const after = readPreservedCounts(sqlite, "version")
  if (
    before.documentCount !== after.documentCount ||
    before.nodeCount !== after.nodeCount ||
    before.revisionTotal !== after.revisionTotal ||
    before.searchCount !== after.searchCount
  ) {
    throw new Error("legacy resource-library row preservation failed")
  }
}

function readResourceSchemaState(sqlite: Database): ResourceSchemaState {
  const tables = readTableNames(sqlite)
  const coreTables = [
    "admin_resource_assets",
    "admin_resource_documents",
    "admin_resource_nodes",
    "admin_resource_search",
  ] as const
  const presentCount = coreTables.filter((table) => tables.has(table)).length
  if (presentCount === 0) return "absent"

  const nodeColumns = readColumnNames(sqlite, "admin_resource_nodes")
  const documentColumns = readColumnNames(sqlite, "admin_resource_documents")
  const searchColumns = readColumnNames(sqlite, "admin_resource_search")
  const assetColumns = readColumnNames(sqlite, "admin_resource_assets")
  if (
    presentCount === coreTables.length &&
    hasExactColumns(documentColumns, currentDocumentColumns) &&
    hasExactColumns(searchColumns, currentSearchColumns) &&
    ((hasExactColumns(nodeColumns, currentNodeColumns) &&
      (hasExactColumns(assetColumns, baselineAssetColumns) ||
        hasExactColumns(assetColumns, currentAssetColumns))) ||
      (hasExactColumns(nodeColumns, legacyNodeColumns) &&
        hasExactColumns(assetColumns, baselineAssetColumns)))
  ) {
    return "current"
  }

  if (
    presentCount === 3 &&
    !tables.has("admin_resource_assets") &&
    hasExactColumns(nodeColumns, legacyNodeColumns) &&
    hasExactColumns(documentColumns, legacyDocumentColumns) &&
    hasExactColumns(searchColumns, legacySearchColumns)
  ) {
    return "known-legacy"
  }

  throw new Error("unsupported partial resource-library schema")
}

function validateKnownLegacyResourceRows(sqlite: Database): void {
  const invalidNode = sqlite
    .query<{ readonly id: string }, []>(`
      SELECT id
      FROM admin_resource_nodes
      WHERE id = ''
        OR created_by = ''
        OR updated_by = ''
        OR kind NOT IN ('folder', 'document')
        OR status NOT IN ('active', 'archived')
        OR (status = 'active' AND trash_root_id IS NOT NULL)
        OR (status = 'archived' AND trash_root_id IS NULL)
      LIMIT 1
    `)
    .get()
  if (invalidNode !== null) {
    throw new Error(
      `legacy resource-library node is invalid: ${invalidNode.id}`
    )
  }

  const invalidDocument = sqlite
    .query<{ readonly nodeId: string }, []>(`
      SELECT document.node_id AS nodeId
      FROM admin_resource_documents document
      LEFT JOIN admin_resource_nodes node ON node.id = document.node_id
      WHERE node.id IS NULL
        OR node.kind <> 'document'
        OR typeof(document.content_revision) <> 'integer'
        OR document.content_revision < 0
      LIMIT 1
    `)
    .get()
  if (invalidDocument !== null) {
    throw new Error(
      `legacy resource-library document is invalid: ${invalidDocument.nodeId}`
    )
  }

  const invalidSearchRow = sqlite
    .query<{ readonly rowId: number }, []>(`
      SELECT search.rowid AS rowId
      FROM admin_resource_search search
      LEFT JOIN admin_resource_nodes node ON node.id = search.node_id
      WHERE node.id IS NULL
        OR search.node_id IS NULL
        OR search.name IS NULL
        OR search.body_text IS NULL
      LIMIT 1
    `)
    .get()
  if (invalidSearchRow !== null) {
    throw new Error(
      `legacy resource-library search row is invalid: ${invalidSearchRow.rowId}`
    )
  }
}

function readPreservedCounts(
  sqlite: Database,
  revisionColumn: "content_revision" | "version"
): Readonly<{
  documentCount: number
  nodeCount: number
  revisionTotal: number
  searchCount: number
}> {
  return {
    documentCount: readTableCount(sqlite, "admin_resource_documents"),
    nodeCount: readTableCount(sqlite, "admin_resource_nodes"),
    revisionTotal:
      sqlite
        .query<{ readonly total: number }, []>(`
          SELECT COALESCE(SUM(${revisionColumn}), 0) AS total
          FROM admin_resource_documents
        `)
        .get()?.total ?? 0,
    searchCount: readTableCount(sqlite, "admin_resource_search"),
  }
}

function readTableCount(sqlite: Database, tableName: string): number {
  return (
    sqlite
      .query<{ readonly count: number }, []>(
        `SELECT COUNT(*) AS count FROM ${tableName}`
      )
      .get()?.count ?? 0
  )
}

function readTableNames(sqlite: Database): ReadonlySet<string> {
  return new Set(
    sqlite
      .query<{ readonly name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table'"
      )
      .all()
      .map(({ name }) => name)
  )
}

function readColumnNames(
  sqlite: Database,
  tableName: string
): ReadonlySet<string> {
  return new Set(
    sqlite
      .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
      .all()
      .map(({ name }) => name)
  )
}

function hasExactColumns(
  actual: ReadonlySet<string>,
  expected: readonly string[]
): boolean {
  return (
    actual.size === expected.length &&
    expected.every((column) => actual.has(column))
  )
}
