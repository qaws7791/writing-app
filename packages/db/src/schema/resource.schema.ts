import { sql } from "drizzle-orm"
import {
  blob,
  check,
  index,
  integer,
  primaryKey,
  type AnySQLiteColumn,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import { adminAuthUsers } from "@workspace/db/schema/admin-auth.schema"

export const resourceNodeKindValues = ["folder", "document"] as const
export const resourceNodeStatusValues = ["active", "archived"] as const
export const resourceAuditEventTypeValues = [
  "create",
  "import",
  "move",
  "rename",
  "reorder",
  "restore",
  "trash",
] as const

export const adminResourceNodes = sqliteTable(
  "admin_resource_nodes",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => adminAuthUsers.id, { onDelete: "restrict" }),
    id: text("id").primaryKey().notNull(),
    kind: text("kind", { enum: resourceNodeKindValues }).notNull(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    parentId: text("parent_id").references(
      (): AnySQLiteColumn => adminResourceNodes.id,
      { onDelete: "restrict" }
    ),
    sortOrder: integer("sort_order").notNull(),
    status: text("status", { enum: resourceNodeStatusValues })
      .notNull()
      .default("active"),
    trashRootId: text("trash_root_id").references(
      (): AnySQLiteColumn => adminResourceNodes.id,
      { onDelete: "restrict" }
    ),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => adminAuthUsers.id, { onDelete: "restrict" }),
  },
  (table) => [
    check(
      "admin_resource_nodes_id_length_check",
      sql`length(${table.id}) BETWEEN 1 AND 128`
    ),
    check(
      "admin_resource_nodes_kind_check",
      sql`${table.kind} IN ('folder', 'document')`
    ),
    check(
      "admin_resource_nodes_name_check",
      sql`length(trim(${table.name})) BETWEEN 1 AND 120`
    ),
    check(
      "admin_resource_nodes_normalized_name_check",
      sql`length(${table.normalizedName}) > 0`
    ),
    check(
      "admin_resource_nodes_sort_order_check",
      sql`${table.sortOrder} >= 0`
    ),
    check(
      "admin_resource_nodes_status_check",
      sql`${table.status} IN ('active', 'archived')`
    ),
    check(
      "admin_resource_nodes_trash_state_check",
      sql`(${table.status} = 'active' AND ${table.trashRootId} IS NULL) OR (${table.status} = 'archived' AND ${table.trashRootId} IS NOT NULL)`
    ),
    index("admin_resource_nodes_parent_sort_idx").on(
      table.parentId,
      table.sortOrder,
      table.id
    ),
    index("admin_resource_nodes_trash_root_idx").on(
      table.trashRootId,
      table.sortOrder,
      table.id
    ),
    uniqueIndex("admin_resource_nodes_active_root_name_uq")
      .on(table.normalizedName)
      .where(sql`${table.status} = 'active' AND ${table.parentId} IS NULL`),
    uniqueIndex("admin_resource_nodes_active_child_name_uq")
      .on(table.parentId, table.normalizedName)
      .where(sql`${table.status} = 'active' AND ${table.parentId} IS NOT NULL`),
  ]
)

export const adminResourceDocuments = sqliteTable(
  "admin_resource_documents",
  {
    contentMarkdown: text("content_markdown").notNull().default(""),
    contentRevision: integer("content_revision").notNull().default(0),
    nodeId: text("node_id")
      .primaryKey()
      .notNull()
      .references(() => adminResourceNodes.id, { onDelete: "cascade" }),
  },
  (table) => [
    check(
      "admin_resource_documents_content_length_check",
      sql`length(${table.contentMarkdown}) <= 200000`
    ),
    check(
      "admin_resource_documents_revision_check",
      sql`${table.contentRevision} >= 0`
    ),
  ]
)

export const adminResourceCollaboration = sqliteTable(
  "admin_resource_collaboration",
  {
    documentId: text("document_id")
      .primaryKey()
      .notNull()
      .references(() => adminResourceDocuments.nodeId, {
        onDelete: "cascade",
      }),
    projectedAt: integer("projected_at", { mode: "timestamp_ms" }),
    stateVersion: integer("state_version").notNull().default(0),
    yjsState: blob("yjs_state", { mode: "buffer" }).notNull(),
  },
  (table) => [
    check(
      "admin_resource_collaboration_snapshot_size_check",
      sql`length(${table.yjsState}) <= 3000000`
    ),
    check(
      "admin_resource_collaboration_state_version_check",
      sql`${table.stateVersion} >= 0`
    ),
  ]
)

export const adminResourceCollaborationUpdates = sqliteTable(
  "admin_resource_collaboration_updates",
  {
    actorId: text("actor_id")
      .notNull()
      .references(() => adminAuthUsers.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    contentRevision: integer("content_revision").notNull(),
    documentId: text("document_id")
      .notNull()
      .references(() => adminResourceDocuments.nodeId, {
        onDelete: "cascade",
      }),
    stateVersion: integer("state_version").notNull(),
    transactionId: text("transaction_id").notNull(),
    yjsUpdate: blob("yjs_update", { mode: "buffer" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.documentId, table.stateVersion] }),
    uniqueIndex("admin_resource_collaboration_updates_transaction_uq").on(
      table.documentId,
      table.transactionId
    ),
    check(
      "admin_resource_collaboration_updates_state_version_check",
      sql`${table.stateVersion} > 0`
    ),
    check(
      "admin_resource_collaboration_updates_content_revision_check",
      sql`${table.contentRevision} > 0`
    ),
    check(
      "admin_resource_collaboration_updates_transaction_id_check",
      sql`length(${table.transactionId}) BETWEEN 1 AND 128`
    ),
    check(
      "admin_resource_collaboration_updates_size_check",
      sql`length(${table.yjsUpdate}) <= 524288`
    ),
  ]
)

export const adminResourceCollaborationTransactions = sqliteTable(
  "admin_resource_collaboration_transactions",
  {
    actorId: text("actor_id")
      .notNull()
      .references(() => adminAuthUsers.id, { onDelete: "restrict" }),
    contentRevision: integer("content_revision").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    documentId: text("document_id")
      .notNull()
      .references(() => adminResourceDocuments.nodeId, {
        onDelete: "cascade",
      }),
    stateVersion: integer("state_version").notNull(),
    transactionId: text("transaction_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.documentId, table.transactionId] }),
    check(
      "admin_resource_collaboration_transactions_state_version_check",
      sql`${table.stateVersion} > 0`
    ),
    check(
      "admin_resource_collaboration_transactions_content_revision_check",
      sql`${table.contentRevision} > 0`
    ),
    check(
      "admin_resource_collaboration_transactions_id_check",
      sql`length(${table.transactionId}) BETWEEN 1 AND 128`
    ),
  ]
)

export const adminResourceAuditEvents = sqliteTable(
  "admin_resource_audit_events",
  {
    actorId: text("actor_id")
      .notNull()
      .references(() => adminAuthUsers.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    eventType: text("event_type", {
      enum: resourceAuditEventTypeValues,
    }).notNull(),
    id: text("id").primaryKey().notNull(),
    nodeId: text("node_id")
      .notNull()
      .references(() => adminResourceNodes.id, { onDelete: "restrict" }),
    payloadJson: text("payload_json").notNull(),
  },
  (table) => [
    check(
      "admin_resource_audit_events_type_check",
      sql`${table.eventType} IN ('create', 'import', 'move', 'rename', 'reorder', 'restore', 'trash')`
    ),
    check(
      "admin_resource_audit_events_payload_check",
      sql`json_valid(${table.payloadJson})`
    ),
    index("admin_resource_audit_events_node_created_idx").on(
      table.nodeId,
      table.createdAt
    ),
  ]
)

export const adminResourceTreeState = sqliteTable(
  "admin_resource_tree_state",
  {
    revision: integer("revision").notNull().default(0),
    singletonId: integer("singleton_id").primaryKey().notNull().default(1),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check(
      "admin_resource_tree_state_singleton_check",
      sql`${table.singletonId} = 1`
    ),
    check(
      "admin_resource_tree_state_revision_check",
      sql`${table.revision} >= 0`
    ),
  ]
)
