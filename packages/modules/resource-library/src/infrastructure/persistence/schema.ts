import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  type AnySQLiteColumn,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const resourceNodeKindValues = ["folder", "document"] as const
export const resourceNodeStatusValues = ["active", "trashed"] as const
export const resourceAssetStatusValues = ["active", "delete-pending"] as const
export const resourceAssetContentTypeValues = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export const adminResourceNodes = sqliteTable(
  "admin_resource_nodes",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    createdBy: text("created_by").notNull(),
    id: text("id").primaryKey().notNull(),
    kind: text("kind", { enum: resourceNodeKindValues }).notNull(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    parentId: text("parent_id").references(
      (): AnySQLiteColumn => adminResourceNodes.id,
      { onDelete: "restrict" }
    ),
    status: text("status", { enum: resourceNodeStatusValues })
      .notNull()
      .default("active"),
    trashRootId: text("trash_root_id").references(
      (): AnySQLiteColumn => adminResourceNodes.id,
      { onDelete: "restrict" }
    ),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    updatedBy: text("updated_by").notNull(),
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
      "admin_resource_nodes_status_check",
      sql`${table.status} IN ('active', 'trashed')`
    ),
    check(
      "admin_resource_nodes_trash_state_check",
      sql`(${table.status} = 'active' AND ${table.trashRootId} IS NULL) OR (${table.status} = 'trashed' AND ${table.trashRootId} IS NOT NULL)`
    ),
    index("admin_resource_nodes_parent_name_idx").on(
      table.parentId,
      table.normalizedName,
      table.id
    ),
    index("admin_resource_nodes_trash_root_idx").on(
      table.trashRootId,
      table.normalizedName,
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
    nodeId: text("node_id")
      .primaryKey()
      .notNull()
      .references(() => adminResourceNodes.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(0),
  },
  (table) => [
    check(
      "admin_resource_documents_content_length_check",
      sql`length(${table.contentMarkdown}) <= 200000`
    ),
    check("admin_resource_documents_version_check", sql`${table.version} >= 0`),
  ]
)

export const adminResourceAssets = sqliteTable(
  "admin_resource_assets",
  {
    altText: text("alt_text").notNull(),
    byteSize: integer("byte_size").notNull(),
    contentType: text("content_type", {
      enum: resourceAssetContentTypeValues,
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    deleteRequestedAt: integer("delete_requested_at", {
      mode: "timestamp_ms",
    }),
    deleteRequestedBy: text("delete_requested_by"),
    deleteRootId: text("delete_root_id").references(
      (): AnySQLiteColumn => adminResourceNodes.id,
      { onDelete: "restrict" }
    ),
    documentId: text("document_id")
      .notNull()
      .references(() => adminResourceDocuments.nodeId, {
        onDelete: "cascade",
      }),
    id: text("id").primaryKey().notNull(),
    objectKey: text("r2_object_key").notNull(),
    status: text("status", { enum: resourceAssetStatusValues })
      .notNull()
      .default("active"),
  },
  (table) => [
    check(
      "admin_resource_assets_alt_text_check",
      sql`length(trim(${table.altText})) BETWEEN 1 AND 500`
    ),
    check(
      "admin_resource_assets_byte_size_check",
      sql`${table.byteSize} BETWEEN 1 AND 5242880`
    ),
    check(
      "admin_resource_assets_content_type_check",
      sql`${table.contentType} IN ('image/jpeg', 'image/png', 'image/webp')`
    ),
    check(
      "admin_resource_assets_status_check",
      sql`${table.status} IN ('active', 'delete-pending')`
    ),
    check(
      "admin_resource_assets_delete_state_check",
      sql`(${table.status} = 'active' AND ${table.deleteRootId} IS NULL AND ${table.deleteRequestedAt} IS NULL AND ${table.deleteRequestedBy} IS NULL) OR (${table.status} = 'delete-pending' AND ${table.deleteRootId} IS NOT NULL AND ${table.deleteRequestedAt} IS NOT NULL AND ${table.deleteRequestedBy} IS NOT NULL)`
    ),
    uniqueIndex("admin_resource_assets_object_key_uq").on(table.objectKey),
    index("admin_resource_assets_document_idx").on(table.documentId, table.id),
    index("admin_resource_assets_delete_pending_idx").on(
      table.status,
      table.deleteRequestedAt,
      table.id
    ),
  ]
)
