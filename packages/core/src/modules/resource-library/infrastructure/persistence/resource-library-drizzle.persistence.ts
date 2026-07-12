import { and, asc, eq, getTableColumns, isNull, ne, sql } from "drizzle-orm"

import type { ResourceTreeCommandRejection } from "#core/modules/resource-library/application/ports/resource-tree.repository"
import {
  toResourceDocumentId,
  toResourceFolderId,
  toResourceNodeId,
  type ResourceAuditEventId,
  type ResourceBreadcrumbItem,
  type ResourceFolderId,
  type ResourceNodeId,
  type ResourceTreeEntry,
  type ResourceTreeNode,
  type ResourceTreeScope,
} from "#core/modules/resource-library/domain/resource-tree-node"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  adminResourceAuditEvents,
  adminResourceNodes,
  adminResourceTreeState,
} from "@workspace/db/schema"

export type WritingAppDatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

export type ResourceNodeRow = typeof adminResourceNodes.$inferSelect
type ResourceAuditEventType =
  (typeof adminResourceAuditEvents.$inferInsert)["eventType"]

export type ResourceAuditPayload =
  | {
      readonly kind: "create"
      readonly name: string
      readonly nodeKind: ResourceTreeNode["kind"]
      readonly parentId: ResourceFolderId | null
    }
  | {
      readonly fromName: string
      readonly kind: "rename"
      readonly toName: string
    }
  | {
      readonly fromIndex: number
      readonly fromParentId: ResourceFolderId | null
      readonly kind: "move" | "reorder"
      readonly toIndex: number
      readonly toParentId: ResourceFolderId | null
    }
  | {
      readonly documentCount: number
      readonly folderCount: number
      readonly kind: "restore" | "trash"
    }
  | {
      readonly kind: "import"
      readonly name: string
      readonly parentId: ResourceFolderId | null
    }

type RecursiveResourceNodeRow = {
  readonly id: string
  readonly kind: ResourceNodeRow["kind"]
  readonly name: string
  readonly normalized_name: string
  readonly parent_id: string | null
  readonly sort_order: number
  readonly status: ResourceNodeRow["status"]
  readonly trash_root_id: string | null
}

export function validateTreeRevision(
  transaction: WritingAppDatabaseTransaction,
  input: { readonly expectedRevision: number }
): ResourceTreeCommandRejection | null {
  const actualRevision = readTreeRevision(transaction)

  return actualRevision === input.expectedRevision
    ? null
    : { actualRevision, kind: "stale-revision" }
}

export function reserveTreeRevision(
  transaction: WritingAppDatabaseTransaction,
  input: {
    readonly expectedRevision: number
    readonly now: Date
  }
): number {
  transaction
    .update(adminResourceTreeState)
    .set({
      revision: sql`${adminResourceTreeState.revision} + 1`,
      updatedAt: input.now,
    })
    .where(
      and(
        eq(adminResourceTreeState.singletonId, 1),
        eq(adminResourceTreeState.revision, input.expectedRevision)
      )
    )
    .run()
  const changed = transaction
    .select({ value: sql<number>`changes()` })
    .from(sql`(SELECT 1)`)
    .get()?.value

  if (changed !== 1) {
    throw new Error("자료 트리 revision을 예약하지 못했습니다.")
  }

  return input.expectedRevision + 1
}

export function readTreeRevision(
  database: WritingAppDatabase | WritingAppDatabaseTransaction
): number {
  const state = database
    .select({ revision: adminResourceTreeState.revision })
    .from(adminResourceTreeState)
    .where(eq(adminResourceTreeState.singletonId, 1))
    .get()

  if (state === undefined) {
    throw new Error("자료 트리 revision 상태가 없습니다.")
  }

  return state.revision
}

export function validateActiveParent(
  transaction: WritingAppDatabaseTransaction,
  parentId: ResourceFolderId | null
): { readonly kind: "parent-not-found" } | null {
  if (parentId === null) {
    return null
  }

  const parent = transaction
    .select({ id: adminResourceNodes.id })
    .from(adminResourceNodes)
    .where(
      and(
        eq(adminResourceNodes.id, parentId),
        eq(adminResourceNodes.kind, "folder"),
        eq(adminResourceNodes.status, "active")
      )
    )
    .get()

  return parent === undefined ? { kind: "parent-not-found" } : null
}

export function readActiveNodeRow(
  database: WritingAppDatabase | WritingAppDatabaseTransaction,
  nodeId: ResourceNodeId
): ResourceNodeRow | undefined {
  return database
    .select()
    .from(adminResourceNodes)
    .where(
      and(
        eq(adminResourceNodes.id, nodeId),
        eq(adminResourceNodes.status, "active")
      )
    )
    .get()
}

export function readActiveChildRows(
  database: WritingAppDatabase | WritingAppDatabaseTransaction,
  parentId: ResourceFolderId | null,
  excludedNodeId?: ResourceNodeId
): readonly ResourceNodeRow[] {
  const parentCondition =
    parentId === null
      ? isNull(adminResourceNodes.parentId)
      : eq(adminResourceNodes.parentId, parentId)
  const excludedNodeCondition =
    excludedNodeId === undefined
      ? undefined
      : ne(adminResourceNodes.id, excludedNodeId)

  return database
    .select(getTableColumns(adminResourceNodes))
    .from(adminResourceNodes)
    .where(
      and(
        parentCondition,
        eq(adminResourceNodes.status, "active"),
        excludedNodeCondition
      )
    )
    .orderBy(asc(adminResourceNodes.sortOrder), asc(adminResourceNodes.id))
    .all()
}

export function readResourceChildren(
  database: WritingAppDatabase | WritingAppDatabaseTransaction,
  input: {
    readonly parentId: ResourceFolderId | null
    readonly scope: ResourceTreeScope
  }
): readonly ResourceTreeEntry[] {
  const parentCondition =
    input.parentId === null
      ? input.scope === "active"
        ? isNull(adminResourceNodes.parentId)
        : eq(adminResourceNodes.id, adminResourceNodes.trashRootId)
      : eq(adminResourceNodes.parentId, input.parentId)
  const status = input.scope === "active" ? "active" : "archived"

  return database
    .select({
      ...getTableColumns(adminResourceNodes),
      hasChildren: sql<number>`EXISTS (
        SELECT 1
        FROM admin_resource_nodes AS child
        WHERE child.parent_id = ${sql.identifier("admin_resource_nodes")}.${sql.identifier("id")}
          AND child.status = ${status}
      )`.mapWith(Boolean),
    })
    .from(adminResourceNodes)
    .where(and(parentCondition, eq(adminResourceNodes.status, status)))
    .orderBy(asc(adminResourceNodes.sortOrder), asc(adminResourceNodes.id))
    .all()
    .map((row) => ({
      hasChildren: row.hasChildren,
      node: toResourceTreeNode(row),
    }))
}

export function insertResourceSearchIndex(
  transaction: WritingAppDatabaseTransaction,
  input: {
    readonly bodyText: string
    readonly kind: ResourceTreeNode["kind"]
    readonly name: string
    readonly nodeId: ResourceNodeId
  }
): void {
  transaction.run(sql`
    INSERT INTO admin_resource_search (node_id, kind, name, body_text)
    VALUES (${input.nodeId}, ${input.kind}, ${input.name}, ${input.bodyText})
  `)
}

export function updateResourceSearchName(
  transaction: WritingAppDatabaseTransaction,
  input: { readonly name: string; readonly nodeId: ResourceNodeId }
): void {
  transaction.run(sql`
    UPDATE admin_resource_search
    SET name = ${input.name}
    WHERE node_id = ${input.nodeId}
  `)
}

export function updateResourceSearchBody(
  transaction: WritingAppDatabaseTransaction,
  input: { readonly bodyText: string; readonly nodeId: ResourceNodeId }
): void {
  transaction.run(sql`
    UPDATE admin_resource_search
    SET body_text = ${input.bodyText}
    WHERE node_id = ${input.nodeId}
  `)
}

export function readResourceSubtree(
  database: WritingAppDatabase | WritingAppDatabaseTransaction,
  nodeId: ResourceNodeId
): readonly ResourceTreeNode[] {
  return database
    .all<RecursiveResourceNodeRow>(sql`
      WITH RECURSIVE subtree(
        id,
        kind,
        parent_id,
        name,
        normalized_name,
        sort_order,
        status,
        trash_root_id,
        sort_path
      ) AS (
        SELECT
          id,
          kind,
          parent_id,
          name,
          normalized_name,
          sort_order,
          status,
          trash_root_id,
          printf('%010d:%s', sort_order, id)
        FROM admin_resource_nodes
        WHERE id = ${nodeId}

        UNION ALL

        SELECT
          child.id,
          child.kind,
          child.parent_id,
          child.name,
          child.normalized_name,
          child.sort_order,
          child.status,
          child.trash_root_id,
          parent.sort_path || '/' || printf('%010d:%s', child.sort_order, child.id)
        FROM admin_resource_nodes AS child
        INNER JOIN subtree AS parent ON child.parent_id = parent.id
      )
      SELECT
        id,
        kind,
        parent_id,
        name,
        normalized_name,
        sort_order,
        status,
        trash_root_id
      FROM subtree
      ORDER BY sort_path
    `)
    .map(toResourceTreeNodeFromRecursiveRow)
}

export function readAncestorFolderIds(
  transaction: WritingAppDatabaseTransaction,
  parentId: ResourceFolderId | null
): readonly ResourceFolderId[] {
  if (parentId === null) {
    return []
  }

  return transaction
    .all<{ readonly id: string }>(sql`
      WITH RECURSIVE ancestors(id, parent_id) AS (
        SELECT id, parent_id
        FROM admin_resource_nodes
        WHERE id = ${parentId}

        UNION ALL

        SELECT parent.id, parent.parent_id
        FROM admin_resource_nodes AS parent
        INNER JOIN ancestors AS child ON child.parent_id = parent.id
      )
      SELECT id FROM ancestors
    `)
    .map(({ id }) => toResourceFolderId(id))
}

export function writeSortAssignments(
  transaction: WritingAppDatabaseTransaction,
  assignments: readonly {
    readonly nodeId: ResourceNodeId
    readonly sortOrder: number
  }[],
  input: { readonly actorId: string; readonly now: Date }
): void {
  for (const assignment of assignments) {
    transaction
      .update(adminResourceNodes)
      .set({
        sortOrder: assignment.sortOrder,
        updatedAt: input.now,
        updatedBy: input.actorId,
      })
      .where(
        and(
          eq(adminResourceNodes.id, assignment.nodeId),
          ne(adminResourceNodes.sortOrder, assignment.sortOrder)
        )
      )
      .run()
  }
}

export function insertAuditEvent(
  transaction: WritingAppDatabaseTransaction,
  input: {
    readonly actorId: string
    readonly auditEventId: ResourceAuditEventId
    readonly eventType: ResourceAuditEventType
    readonly nodeId: ResourceNodeId
    readonly now: Date
    readonly payload: ResourceAuditPayload
  }
): void {
  transaction
    .insert(adminResourceAuditEvents)
    .values({
      actorId: input.actorId,
      createdAt: input.now,
      eventType: input.eventType,
      id: input.auditEventId,
      nodeId: input.nodeId,
      payloadJson: JSON.stringify(input.payload),
    })
    .run()
}

export function toResourceTreeNode(row: ResourceNodeRow): ResourceTreeNode {
  const parentId = toParentId(row.parentId)
  const common = {
    name: row.name,
    normalizedName: row.normalizedName,
    parentId,
    sortOrder: row.sortOrder,
    status: row.status,
    trashRootId:
      row.trashRootId === null ? null : toResourceNodeId(row.trashRootId),
  }

  return row.kind === "folder"
    ? { ...common, id: toResourceFolderId(row.id), kind: row.kind }
    : { ...common, id: toResourceDocumentId(row.id), kind: row.kind }
}

export function toResourceNodeIdFromRows(
  id: string,
  rows: readonly Pick<ResourceNodeRow, "id" | "kind">[]
): ResourceNodeId {
  const row = rows.find((candidate) => candidate.id === id)

  if (row === undefined) {
    throw new Error(`자료 node 종류를 찾지 못했습니다: ${id}`)
  }

  return row.kind === "folder"
    ? toResourceFolderId(id)
    : toResourceDocumentId(id)
}

export function toParentId(parentId: string | null): ResourceFolderId | null {
  return parentId === null ? null : toResourceFolderId(parentId)
}

export function countResourceKinds(nodes: readonly ResourceTreeNode[]): {
  readonly documentCount: number
  readonly folderCount: number
} {
  return nodes.reduce(
    (counts, node) =>
      node.kind === "folder"
        ? { ...counts, folderCount: counts.folderCount + 1 }
        : { ...counts, documentCount: counts.documentCount + 1 },
    { documentCount: 0, folderCount: 0 }
  )
}

export function uniqueParentIds(
  parentIds: readonly (ResourceFolderId | null)[]
): readonly (ResourceFolderId | null)[] {
  return parentIds.filter(
    (parentId, index) => parentIds.indexOf(parentId) === index
  )
}

export function parseResourceBreadcrumbPath(
  pathJson: string
): readonly ResourceBreadcrumbItem[] {
  const value: unknown = JSON.parse(pathJson)

  if (!Array.isArray(value) || !value.every(isResourceBreadcrumbValue)) {
    throw new Error("자료 경로 JSON을 해석하지 못했습니다.")
  }

  return value.map((item) => ({
    id: toResourceFolderId(item.id),
    name: item.name,
  }))
}

function toResourceTreeNodeFromRecursiveRow(
  row: RecursiveResourceNodeRow
): ResourceTreeNode {
  const common = {
    name: row.name,
    normalizedName: row.normalized_name,
    parentId: toParentId(row.parent_id),
    sortOrder: row.sort_order,
    status: row.status,
    trashRootId:
      row.trash_root_id === null ? null : toResourceNodeId(row.trash_root_id),
  }

  return row.kind === "folder"
    ? { ...common, id: toResourceFolderId(row.id), kind: row.kind }
    : { ...common, id: toResourceDocumentId(row.id), kind: row.kind }
}

function isResourceBreadcrumbValue(
  value: unknown
): value is { readonly id: string; readonly name: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string"
  )
}
