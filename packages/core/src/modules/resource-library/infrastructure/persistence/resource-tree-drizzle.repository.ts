import { and, asc, eq, getTableColumns, isNull, ne, sql } from "drizzle-orm"

import type {
  CreateResourceNodeInput,
  MoveResourceNodeInput,
  RenameResourceFolderInput,
  ResourceNodeCommandInput,
  ResourcePermanentDeleteResult,
  ResourceRestoreResult,
  ResourceTrashResult,
  ResourceTreeNodeResult,
  ResourceTreeRepository,
} from "#core/modules/resource-library/application/ports/resource-tree.repository"
import {
  createAvailableResourceName,
  restoreResourceSubtree,
  trashResourceSubtree,
  validateResourceMove,
  validateResourceNameChange,
} from "#core/modules/resource-library/domain/resource-tree-policy"
import {
  toResourceDocumentId,
  toResourceFolderId,
  toResourceNodeId,
  type ResourceFolderId,
  type ResourceNodeId,
  type ResourceTreeEntry,
  type ResourceTreeNode,
  type ResourceTreeScope,
} from "#core/modules/resource-library/domain/resource-tree-node"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  adminResourceAssets,
  adminResourceDocuments,
  adminResourceNodes,
} from "@workspace/db/schema"

const maxResourceNodeCount = 1_000
const maxResourceFolderDepth = 3

type DatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]
type ResourceNodeRow = typeof adminResourceNodes.$inferSelect

type RecursiveResourceNodeRow = {
  readonly depth: number
  readonly id: string
  readonly kind: ResourceNodeRow["kind"]
  readonly name: string
  readonly normalized_name: string
  readonly parent_id: string | null
  readonly status: ResourceNodeRow["status"]
  readonly trash_root_id: string | null
}

export function createDrizzleResourceTreeRepository(
  db: WritingAppDatabase
): ResourceTreeRepository {
  return {
    async createNode(input) {
      return createNode(db, input)
    },
    async deleteNodePermanently(input) {
      return deleteNodePermanently(db, input)
    },
    async moveNode(input) {
      return moveNode(db, input)
    },
    async readSubtree(nodeId) {
      return readResourceSubtree(db, nodeId)
    },
    async readTree(scope) {
      return readResourceTree(db, scope)
    },
    async renameFolder(input) {
      return renameFolder(db, input)
    },
    async restoreNode(input) {
      return restoreNode(db, input)
    },
    async trashNode(input) {
      return trashNode(db, input)
    },
  }
}

function createNode(
  db: WritingAppDatabase,
  input: CreateResourceNodeInput
): ResourceTreeNodeResult {
  return db.transaction(
    (transaction) => {
      const count = transaction
        .select({ value: sql<number>`count(*)` })
        .from(adminResourceNodes)
        .get()?.value
      if ((count ?? 0) >= maxResourceNodeCount) {
        return { kind: "node-limit" } as const
      }

      const parentRejection = validateActiveParent(transaction, input.parentId)
      if (parentRejection !== null) return parentRejection

      if (
        input.kind === "folder" &&
        readAncestorFolderIds(transaction, input.parentId).length >=
          maxResourceFolderDepth
      ) {
        return { kind: "depth-limit" } as const
      }

      const siblings = readActiveChildRows(transaction, input.parentId)
      const name = createAvailableResourceName(
        input.preferredName,
        siblings.map(({ normalizedName }) => normalizedName)
      )
      const node: ResourceTreeNode =
        input.kind === "folder"
          ? {
              ...name,
              id: input.nodeId,
              kind: "folder",
              parentId: input.parentId,
              status: "active",
              trashRootId: null,
            }
          : {
              ...name,
              id: input.nodeId,
              kind: "document",
              parentId: input.parentId,
              status: "active",
              trashRootId: null,
            }

      transaction
        .insert(adminResourceNodes)
        .values({
          createdAt: input.now,
          createdBy: input.actorId,
          id: node.id,
          kind: node.kind,
          name: node.name,
          normalizedName: node.normalizedName,
          parentId: node.parentId,
          status: node.status,
          trashRootId: null,
          updatedAt: input.now,
          updatedBy: input.actorId,
        })
        .run()

      if (node.kind === "document") {
        transaction
          .insert(adminResourceDocuments)
          .values({ nodeId: node.id })
          .run()
        insertResourceSearch(transaction, {
          bodyText: "",
          name: node.name,
          nodeId: node.id,
        })
      }

      return { kind: "ok", value: { node } } as const
    },
    { behavior: "immediate" }
  )
}

function renameFolder(
  db: WritingAppDatabase,
  input: RenameResourceFolderInput
): ResourceTreeNodeResult {
  return db.transaction(
    (transaction) => {
      const row = readActiveNodeRow(transaction, input.folderId)
      if (row === undefined || row.kind !== "folder") {
        return { kind: "not-found" } as const
      }

      const validation = validateResourceNameChange({
        currentNormalizedName: row.normalizedName,
        name: input.name,
        occupiedNormalizedNames: readActiveChildRows(
          transaction,
          toParentId(row.parentId),
          input.folderId
        ).map(({ normalizedName }) => normalizedName),
      })
      if (validation.status === "invalid") {
        return validation.reason === "conflict"
          ? ({ kind: "name-conflict" } as const)
          : ({
              kind: "invalid-name",
              reason: validation.reason,
            } as const)
      }

      transaction
        .update(adminResourceNodes)
        .set({
          name: validation.name,
          normalizedName: validation.normalizedName,
          updatedAt: input.now,
          updatedBy: input.actorId,
        })
        .where(eq(adminResourceNodes.id, input.folderId))
        .run()

      return {
        kind: "ok",
        value: {
          node: toResourceTreeNode({
            ...row,
            name: validation.name,
            normalizedName: validation.normalizedName,
            updatedAt: input.now,
            updatedBy: input.actorId,
          }),
        },
      } as const
    },
    { behavior: "immediate" }
  )
}

function moveNode(
  db: WritingAppDatabase,
  input: MoveResourceNodeInput
): ResourceTreeNodeResult {
  return db.transaction(
    (transaction) => {
      const row = readActiveNodeRow(transaction, input.nodeId)
      if (row === undefined) return { kind: "not-found" } as const

      const parentRejection = validateActiveParent(
        transaction,
        input.destinationParentId
      )
      if (parentRejection !== null) return parentRejection

      if (row.parentId === input.destinationParentId) {
        return { kind: "ok", value: { node: toResourceTreeNode(row) } } as const
      }

      const destinationSiblings = readActiveChildRows(
        transaction,
        input.destinationParentId,
        input.nodeId
      )
      if (
        destinationSiblings.some(
          ({ normalizedName }) => normalizedName === row.normalizedName
        )
      ) {
        return { kind: "name-conflict" } as const
      }

      const destinationAncestorIds = readAncestorFolderIds(
        transaction,
        input.destinationParentId
      )
      const moveValidation = validateResourceMove({
        destinationAncestorIds,
        destinationParentId: input.destinationParentId,
        movingNodeId: input.nodeId,
      })
      if (moveValidation.status === "invalid") {
        return { kind: "cycle" } as const
      }

      if (row.kind === "folder") {
        const maximumRelativeFolderDepth = Math.max(
          ...readResourceSubtree(transaction, input.nodeId)
            .filter((node) => node.kind === "folder")
            .map((node) =>
              readRelativeDepth(transaction, input.nodeId, node.id)
            ),
          1
        )
        if (
          destinationAncestorIds.length + maximumRelativeFolderDepth >
          maxResourceFolderDepth
        ) {
          return { kind: "depth-limit" } as const
        }
      }

      transaction
        .update(adminResourceNodes)
        .set({
          parentId: input.destinationParentId,
          updatedAt: input.now,
          updatedBy: input.actorId,
        })
        .where(eq(adminResourceNodes.id, input.nodeId))
        .run()

      return {
        kind: "ok",
        value: {
          node: toResourceTreeNode({
            ...row,
            parentId: input.destinationParentId,
            updatedAt: input.now,
            updatedBy: input.actorId,
          }),
        },
      } as const
    },
    { behavior: "immediate" }
  )
}

function trashNode(
  db: WritingAppDatabase,
  input: ResourceNodeCommandInput
): ResourceTrashResult {
  return db.transaction(
    (transaction) => {
      const root = readActiveNodeRow(transaction, input.nodeId)
      if (root === undefined) return { kind: "not-found" } as const

      const subtree = readResourceSubtree(transaction, input.nodeId)
      const transition = trashResourceSubtree(subtree, input.nodeId)
      if (transition.status === "invalid") {
        throw new Error("자료 하위 트리의 휴지통 상태를 계산하지 못했습니다.")
      }

      transaction.run(sql`
        WITH RECURSIVE subtree(id) AS (
          SELECT ${input.nodeId}
          UNION ALL
          SELECT child.id
          FROM admin_resource_nodes AS child
          INNER JOIN subtree AS parent ON child.parent_id = parent.id
        )
        UPDATE admin_resource_nodes
        SET
          status = 'trashed',
          trash_root_id = ${input.nodeId},
          updated_by = ${input.actorId},
          updated_at = ${input.now.getTime()}
        WHERE id IN (SELECT id FROM subtree)
      `)

      return {
        kind: "ok",
        value: countResourceKinds(transition.nodes),
      } as const
    },
    { behavior: "immediate" }
  )
}

function restoreNode(
  db: WritingAppDatabase,
  input: ResourceNodeCommandInput
): ResourceRestoreResult {
  return db.transaction(
    (transaction) => {
      const rootRow = transaction
        .select()
        .from(adminResourceNodes)
        .where(
          and(
            eq(adminResourceNodes.id, input.nodeId),
            eq(adminResourceNodes.status, "trashed"),
            eq(adminResourceNodes.trashRootId, input.nodeId)
          )
        )
        .get()
      if (rootRow === undefined) return { kind: "not-found" } as const

      const parentId = toParentId(rootRow.parentId)
      const parentRejection = validateActiveParent(transaction, parentId)
      if (parentRejection !== null) return parentRejection

      const subtree = readResourceSubtree(transaction, input.nodeId)
      const transition = restoreResourceSubtree({
        nodes: subtree,
        occupiedTargetSiblingNormalizedNames: readActiveChildRows(
          transaction,
          parentId
        ).map(({ normalizedName }) => normalizedName),
        trashRootId: input.nodeId,
      })
      if (transition.status === "invalid") {
        throw new Error("자료 하위 트리의 복원 상태를 계산하지 못했습니다.")
      }

      const restoredRoot = transition.nodes.find(
        ({ id }) => id === input.nodeId
      )
      if (restoredRoot === undefined) {
        throw new Error("복원할 자료의 최상위 항목을 찾지 못했습니다.")
      }

      transaction
        .update(adminResourceNodes)
        .set({
          name: restoredRoot.name,
          normalizedName: restoredRoot.normalizedName,
        })
        .where(eq(adminResourceNodes.id, input.nodeId))
        .run()
      transaction
        .update(adminResourceNodes)
        .set({
          status: "active",
          trashRootId: null,
          updatedAt: input.now,
          updatedBy: input.actorId,
        })
        .where(eq(adminResourceNodes.trashRootId, input.nodeId))
        .run()

      return {
        kind: "ok",
        value: {
          ...countResourceKinds(transition.nodes),
          node: restoredRoot,
        },
      } as const
    },
    { behavior: "immediate" }
  )
}

function deleteNodePermanently(
  db: WritingAppDatabase,
  input: ResourceNodeCommandInput
): ResourcePermanentDeleteResult {
  return db.transaction(
    (transaction) => {
      const root = transaction
        .select({ id: adminResourceNodes.id })
        .from(adminResourceNodes)
        .where(
          and(
            eq(adminResourceNodes.id, input.nodeId),
            eq(adminResourceNodes.status, "trashed"),
            eq(adminResourceNodes.trashRootId, input.nodeId)
          )
        )
        .get()
      if (root === undefined) return { kind: "not-found" } as const

      const rows = readResourceSubtreeRows(transaction, input.nodeId)
      const nodeIds = rows.map(({ id }) => id)
      const placeholders = sql.join(
        nodeIds.map((id) => sql`${id}`),
        sql`, `
      )
      const r2ObjectKeys = transaction
        .select({ r2ObjectKey: adminResourceAssets.r2ObjectKey })
        .from(adminResourceAssets)
        .innerJoin(
          adminResourceDocuments,
          eq(adminResourceDocuments.nodeId, adminResourceAssets.documentId)
        )
        .where(sql`${adminResourceDocuments.nodeId} IN (${placeholders})`)
        .all()
        .map(({ r2ObjectKey }) => r2ObjectKey)

      transaction.run(sql`
        DELETE FROM admin_resource_search
        WHERE node_id IN (${placeholders})
      `)
      for (const row of [...rows].sort(
        (left, right) => right.depth - left.depth
      )) {
        transaction
          .delete(adminResourceNodes)
          .where(eq(adminResourceNodes.id, row.id))
          .run()
      }

      return {
        kind: "ok",
        value: {
          ...countResourceKinds(rows.map(toResourceTreeNodeFromRecursiveRow)),
          r2ObjectKeys,
        },
      } as const
    },
    { behavior: "immediate" }
  )
}

function readResourceTree(
  db: WritingAppDatabase,
  scope: ResourceTreeScope
): readonly ResourceTreeEntry[] {
  const status = scope === "active" ? "active" : "trashed"
  return db
    .select({
      ...getTableColumns(adminResourceNodes),
      hasChildren: sql<number>`EXISTS (
        SELECT 1 FROM admin_resource_nodes AS child
        WHERE child.parent_id = ${sql.identifier("admin_resource_nodes")}.${sql.identifier("id")}
          AND child.status = ${status}
      )`.mapWith(Boolean),
    })
    .from(adminResourceNodes)
    .where(eq(adminResourceNodes.status, status))
    .orderBy(asc(adminResourceNodes.normalizedName), asc(adminResourceNodes.id))
    .all()
    .map((row) => ({
      hasChildren: row.hasChildren,
      node: toResourceTreeNode(row),
    }))
}

function readActiveChildRows(
  db: WritingAppDatabase | DatabaseTransaction,
  parentId: ResourceFolderId | null,
  excludedNodeId?: ResourceNodeId
): readonly ResourceNodeRow[] {
  return db
    .select()
    .from(adminResourceNodes)
    .where(
      and(
        parentId === null
          ? isNull(adminResourceNodes.parentId)
          : eq(adminResourceNodes.parentId, parentId),
        eq(adminResourceNodes.status, "active"),
        excludedNodeId === undefined
          ? undefined
          : ne(adminResourceNodes.id, excludedNodeId)
      )
    )
    .orderBy(asc(adminResourceNodes.normalizedName), asc(adminResourceNodes.id))
    .all()
}

function validateActiveParent(
  transaction: DatabaseTransaction,
  parentId: ResourceFolderId | null
): { readonly kind: "parent-not-found" } | null {
  if (parentId === null) return null
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

function readActiveNodeRow(
  transaction: DatabaseTransaction,
  nodeId: ResourceNodeId
): ResourceNodeRow | undefined {
  return transaction
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

function readAncestorFolderIds(
  transaction: DatabaseTransaction,
  parentId: ResourceFolderId | null
): readonly ResourceFolderId[] {
  if (parentId === null) return []
  return transaction
    .all<{ readonly id: string }>(sql`
      WITH RECURSIVE ancestors(id, parent_id) AS (
        SELECT id, parent_id FROM admin_resource_nodes WHERE id = ${parentId}
        UNION ALL
        SELECT parent.id, parent.parent_id
        FROM admin_resource_nodes AS parent
        INNER JOIN ancestors AS child ON child.parent_id = parent.id
      )
      SELECT id FROM ancestors
    `)
    .map(({ id }) => toResourceFolderId(id))
}

function readRelativeDepth(
  transaction: DatabaseTransaction,
  rootId: ResourceNodeId,
  nodeId: ResourceNodeId
): number {
  return (
    readResourceSubtreeRows(transaction, rootId).find(({ id }) => id === nodeId)
      ?.depth ?? 1
  )
}

function readResourceSubtree(
  db: WritingAppDatabase | DatabaseTransaction,
  nodeId: ResourceNodeId
): readonly ResourceTreeNode[] {
  return readResourceSubtreeRows(db, nodeId).map(
    toResourceTreeNodeFromRecursiveRow
  )
}

function readResourceSubtreeRows(
  db: WritingAppDatabase | DatabaseTransaction,
  nodeId: ResourceNodeId
): readonly RecursiveResourceNodeRow[] {
  return db.all<RecursiveResourceNodeRow>(sql`
    WITH RECURSIVE subtree(
      id, kind, parent_id, name, normalized_name, status, trash_root_id, depth
    ) AS (
      SELECT id, kind, parent_id, name, normalized_name, status, trash_root_id, 1
      FROM admin_resource_nodes WHERE id = ${nodeId}
      UNION ALL
      SELECT child.id, child.kind, child.parent_id, child.name,
        child.normalized_name, child.status, child.trash_root_id, parent.depth + 1
      FROM admin_resource_nodes AS child
      INNER JOIN subtree AS parent ON child.parent_id = parent.id
    )
    SELECT id, kind, parent_id, name, normalized_name, status, trash_root_id, depth
    FROM subtree
    ORDER BY depth, normalized_name, id
  `)
}

function insertResourceSearch(
  transaction: DatabaseTransaction,
  input: {
    readonly bodyText: string
    readonly name: string
    readonly nodeId: ResourceNodeId
  }
): void {
  transaction.run(sql`
    INSERT INTO admin_resource_search (node_id, name, body_text)
    VALUES (${input.nodeId}, ${input.name}, ${input.bodyText})
  `)
}

function countResourceKinds(nodes: readonly ResourceTreeNode[]): {
  readonly documentCount: number
  readonly folderCount: number
} {
  let documentCount = 0
  let folderCount = 0
  for (const node of nodes) {
    if (node.kind === "document") documentCount += 1
    else folderCount += 1
  }
  return { documentCount, folderCount }
}

function toResourceTreeNode(row: ResourceNodeRow): ResourceTreeNode {
  const common = {
    name: row.name,
    normalizedName: row.normalizedName,
    parentId: toParentId(row.parentId),
    status: row.status,
    trashRootId:
      row.trashRootId === null ? null : toResourceNodeId(row.trashRootId),
  }
  return row.kind === "folder"
    ? { ...common, id: toResourceFolderId(row.id), kind: "folder" }
    : { ...common, id: toResourceDocumentId(row.id), kind: "document" }
}

function toResourceTreeNodeFromRecursiveRow(
  row: RecursiveResourceNodeRow
): ResourceTreeNode {
  const common = {
    name: row.name,
    normalizedName: row.normalized_name,
    parentId: toParentId(row.parent_id),
    status: row.status,
    trashRootId:
      row.trash_root_id === null ? null : toResourceNodeId(row.trash_root_id),
  }
  return row.kind === "folder"
    ? { ...common, id: toResourceFolderId(row.id), kind: "folder" }
    : { ...common, id: toResourceDocumentId(row.id), kind: "document" }
}

function toParentId(value: string | null): ResourceFolderId | null {
  return value === null ? null : toResourceFolderId(value)
}
