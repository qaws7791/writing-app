import { and, asc, eq, getTableColumns, isNull, ne, sql } from "drizzle-orm"
import type { WritingAppDatabase } from "@workspace/db/client"

import type {
  ResourceCommandResult,
  ResourceTreeRepository,
} from "#resource-library/application/ports/resource-library-ports"
import {
  createAvailableResourceName,
  resourceMaxFolderDepth,
  resourceMaxNodeCount,
  restoreResourceSubtree,
  trashResourceSubtree,
  validateResourceMove,
  validateResourceNameChange,
} from "#resource-library/domain/resource-tree-policy"
import {
  readResourceAssetId,
  readResourceDocumentId,
  readResourceFolderId,
  readResourceNodeId,
  type ResourceFolderId,
  type ResourceNodeId,
  type ResourceTreeEntry,
  type ResourceTreeNode,
  type ResourceTreeScope,
} from "#resource-library/domain/resource-tree-node"
import {
  adminResourceAssets,
  adminResourceDocuments,
  adminResourceNodes,
} from "#resource-library/infrastructure/persistence/schema"

type DatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]
type ResourceNodeRow = typeof adminResourceNodes.$inferSelect

type RecursiveResourceNodeRow = Readonly<{
  depth: number
  id: string
  kind: ResourceNodeRow["kind"]
  name: string
  normalized_name: string
  parent_id: string | null
  status: ResourceNodeRow["status"]
  trash_root_id: string | null
}>

export function createDrizzleResourceTreeRepository(
  database: WritingAppDatabase
): ResourceTreeRepository {
  return Object.freeze({
    async completePermanentDelete(rootId) {
      return completePermanentDelete(database, rootId)
    },
    async createNode(input) {
      return createNode(database, input)
    },
    async moveNode(input) {
      return moveNode(database, input)
    },
    async preparePermanentDelete(input) {
      return preparePermanentDelete(database, input)
    },
    async readPendingAssetDeletions(limit) {
      return database
        .select({
          assetId: adminResourceAssets.id,
          deleteRootId: adminResourceAssets.deleteRootId,
          objectKey: adminResourceAssets.objectKey,
          requestedAt: adminResourceAssets.deleteRequestedAt,
        })
        .from(adminResourceAssets)
        .where(eq(adminResourceAssets.status, "delete-pending"))
        .orderBy(
          asc(adminResourceAssets.deleteRequestedAt),
          asc(adminResourceAssets.id)
        )
        .limit(limit)
        .all()
        .map((row) => {
          if (row.deleteRootId === null || row.requestedAt === null) {
            throw new Error("삭제 대기 자산 상태가 올바르지 않습니다.")
          }
          return Object.freeze({
            assetId: readResourceAssetId(row.assetId),
            deleteRootId: readResourceNodeId(row.deleteRootId),
            objectKey: row.objectKey,
            requestedAt: row.requestedAt,
          })
        })
    },
    async readSubtree(nodeId) {
      return readResourceSubtree(database, nodeId)
    },
    async readTree(scope) {
      return readResourceTree(database, scope)
    },
    async renameFolder(input) {
      return renameFolder(database, input)
    },
    async restoreNode(input) {
      return restoreNode(database, input)
    },
    async trashNode(input) {
      return trashNode(database, input)
    },
  })
}

function createNode(
  database: WritingAppDatabase,
  input: Parameters<ResourceTreeRepository["createNode"]>[0]
): Awaited<ReturnType<ResourceTreeRepository["createNode"]>> {
  return database.transaction(
    (transaction) => {
      const count = transaction
        .select({ value: sql<number>`count(*)` })
        .from(adminResourceNodes)
        .get()?.value
      if ((count ?? 0) >= resourceMaxNodeCount) {
        return validationError("node-limit")
      }

      const parentRejection = validateActiveParent(transaction, input.parentId)
      if (parentRejection !== null) return parentRejection
      if (
        input.kind === "folder" &&
        readAncestorFolderIds(transaction, input.parentId).length >=
          resourceMaxFolderDepth
      ) {
        return validationError("depth-limit")
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
  database: WritingAppDatabase,
  input: Parameters<ResourceTreeRepository["renameFolder"]>[0]
): Awaited<ReturnType<ResourceTreeRepository["renameFolder"]>> {
  return database.transaction(
    (transaction) => {
      const row = readActiveNodeRow(transaction, input.folderId)
      if (row === undefined || row.kind !== "folder") {
        return notFound("node")
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
          ? nameConflict()
          : nameValidationError(validation.reason)
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
  database: WritingAppDatabase,
  input: Parameters<ResourceTreeRepository["moveNode"]>[0]
): Awaited<ReturnType<ResourceTreeRepository["moveNode"]>> {
  return database.transaction(
    (transaction) => {
      const row = readActiveNodeRow(transaction, input.nodeId)
      if (row === undefined) return notFound("node")

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
        return nameConflict()
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
        return {
          kind: "resource-conflict",
          reason: "move-cycle",
        } as const
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
          resourceMaxFolderDepth
        ) {
          return validationError("depth-limit")
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
  database: WritingAppDatabase,
  input: Parameters<ResourceTreeRepository["trashNode"]>[0]
): Awaited<ReturnType<ResourceTreeRepository["trashNode"]>> {
  return database.transaction(
    (transaction) => {
      const root = readActiveNodeRow(transaction, input.nodeId)
      if (root === undefined) return notFound("node")

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
  database: WritingAppDatabase,
  input: Parameters<ResourceTreeRepository["restoreNode"]>[0]
): Awaited<ReturnType<ResourceTreeRepository["restoreNode"]>> {
  return database.transaction(
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
      if (rootRow === undefined) return notFound("node")

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

function preparePermanentDelete(
  database: WritingAppDatabase,
  input: Parameters<ResourceTreeRepository["preparePermanentDelete"]>[0]
): Awaited<ReturnType<ResourceTreeRepository["preparePermanentDelete"]>> {
  return database.transaction(
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
      if (root === undefined) return notFound("node")

      const rows = readResourceSubtreeRows(transaction, input.nodeId)
      const nodeIds = rows.map(({ id }) => id)
      const placeholders = toSqlList(nodeIds)
      transaction.run(sql`
        UPDATE admin_resource_assets
        SET
          status = 'delete-pending',
          delete_root_id = ${input.nodeId},
          delete_requested_by = ${input.actorId},
          delete_requested_at = ${input.now.getTime()}
        WHERE document_id IN (${placeholders})
      `)

      const assets = transaction
        .select({
          assetId: adminResourceAssets.id,
          deleteRootId: adminResourceAssets.deleteRootId,
          objectKey: adminResourceAssets.objectKey,
          requestedAt: adminResourceAssets.deleteRequestedAt,
        })
        .from(adminResourceAssets)
        .where(eq(adminResourceAssets.deleteRootId, input.nodeId))
        .orderBy(asc(adminResourceAssets.id))
        .all()
        .map((asset) => {
          if (asset.deleteRootId === null || asset.requestedAt === null) {
            throw new Error("삭제 대기 자산 상태가 올바르지 않습니다.")
          }
          return Object.freeze({
            assetId: readResourceAssetId(asset.assetId),
            deleteRootId: readResourceNodeId(asset.deleteRootId),
            objectKey: asset.objectKey,
            requestedAt: asset.requestedAt,
          })
        })

      return {
        kind: "ok",
        value: {
          ...countResourceKinds(rows.map(toResourceTreeNodeFromRecursiveRow)),
          assets,
          rootId: input.nodeId,
        },
      } as const
    },
    { behavior: "immediate" }
  )
}

function completePermanentDelete(
  database: WritingAppDatabase,
  rootId: ResourceNodeId
): Awaited<ReturnType<ResourceTreeRepository["completePermanentDelete"]>> {
  return database.transaction(
    (transaction) => {
      const root = transaction
        .select({ id: adminResourceNodes.id })
        .from(adminResourceNodes)
        .where(
          and(
            eq(adminResourceNodes.id, rootId),
            eq(adminResourceNodes.status, "trashed"),
            eq(adminResourceNodes.trashRootId, rootId)
          )
        )
        .get()
      if (root === undefined) return notFound("node")

      const rows = readResourceSubtreeRows(transaction, rootId)
      const placeholders = toSqlList(rows.map(({ id }) => id))
      const activeAsset = transaction
        .select({ id: adminResourceAssets.id })
        .from(adminResourceAssets)
        .where(
          and(
            sql`${adminResourceAssets.documentId} IN (${placeholders})`,
            ne(adminResourceAssets.status, "delete-pending")
          )
        )
        .get()
      if (activeAsset !== undefined) {
        throw new Error("삭제 준비되지 않은 자료 자산이 남아 있습니다.")
      }

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
      return { kind: "ok", value: undefined } as const
    },
    { behavior: "immediate" }
  )
}

function readResourceTree(
  database: WritingAppDatabase,
  scope: ResourceTreeScope
): readonly ResourceTreeEntry[] {
  const status = scope === "active" ? "active" : "trashed"
  return database
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
  database: WritingAppDatabase | DatabaseTransaction,
  parentId: ResourceFolderId | null,
  excludedNodeId?: ResourceNodeId
): readonly ResourceNodeRow[] {
  return database
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
): ResourceCommandResult<never> | null {
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
  return parent === undefined ? notFound("parent") : null
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
    .map(({ id }) => readResourceFolderId(id))
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
  database: WritingAppDatabase | DatabaseTransaction,
  nodeId: ResourceNodeId
): readonly ResourceTreeNode[] {
  return readResourceSubtreeRows(database, nodeId).map(
    toResourceTreeNodeFromRecursiveRow
  )
}

function readResourceSubtreeRows(
  database: WritingAppDatabase | DatabaseTransaction,
  nodeId: ResourceNodeId
): readonly RecursiveResourceNodeRow[] {
  return database.all<RecursiveResourceNodeRow>(sql`
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
  input: Readonly<{
    bodyText: string
    name: string
    nodeId: ResourceNodeId
  }>
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
      row.trashRootId === null ? null : readResourceNodeId(row.trashRootId),
  }
  return row.kind === "folder"
    ? { ...common, id: readResourceFolderId(row.id), kind: "folder" }
    : { ...common, id: readResourceDocumentId(row.id), kind: "document" }
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
      row.trash_root_id === null ? null : readResourceNodeId(row.trash_root_id),
  }
  return row.kind === "folder"
    ? { ...common, id: readResourceFolderId(row.id), kind: "folder" }
    : { ...common, id: readResourceDocumentId(row.id), kind: "document" }
}

function notFound(
  target: "asset" | "document" | "node" | "parent"
): ResourceCommandResult<never> {
  return { kind: "resource-not-found", target }
}

function nameConflict(): ResourceCommandResult<never> {
  return { kind: "resource-conflict", reason: "name-conflict" }
}

function nameValidationError(
  reason: "empty" | "invalid-character" | "too-long"
): ResourceCommandResult<never> {
  return {
    kind: "resource-validation",
    reason:
      reason === "empty"
        ? "name-empty"
        : reason === "too-long"
          ? "name-too-long"
          : "name-invalid-character",
  }
}

function validationError(
  reason: "depth-limit" | "node-limit"
): ResourceCommandResult<never> {
  return { kind: "resource-validation", reason }
}

function toSqlList(values: readonly string[]) {
  return sql.join(
    values.map((value) => sql`${value}`),
    sql`, `
  )
}

function toParentId(value: string | null): ResourceFolderId | null {
  return value === null ? null : readResourceFolderId(value)
}
