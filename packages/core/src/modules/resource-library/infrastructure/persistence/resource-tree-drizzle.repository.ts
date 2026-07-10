import { and, asc, eq, getTableColumns, isNull, ne, sql } from "drizzle-orm"

import type {
  CreateResourceNodeInput,
  CreateResourceNodeResult,
  MoveResourceNodeInput,
  MoveResourceNodeResult,
  RenameResourceNodeInput,
  RenameResourceNodeResult,
  ResourceTreeCommandRejection,
  ResourceTreeRepository,
  RestoreResourceNodeInput,
  RestoreResourceNodeResult,
  TrashResourceNodeInput,
  TrashResourceNodeResult,
} from "@workspace/core/modules/resource-library/application/ports/resource-tree.repository"
import {
  archiveResourceSubtree,
  createAvailableResourceName,
  createResourceSortAssignments,
  normalizeResourceName,
  restoreResourceSubtree,
  validateResourceMove,
  validateResourceNameChange,
} from "@workspace/core/modules/resource-library/domain/resource-tree-policy"
import {
  toResourceDocumentId,
  toResourceFolderId,
  toResourceNodeId,
  type ResourceFolderId,
  type ResourceNodeId,
  type ResourceTreeNode,
} from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  adminResourceAuditEvents,
  adminResourceDocuments,
  adminResourceNodes,
  adminResourceTreeState,
} from "@workspace/db/schema"

type WritingAppDatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

type ResourceNodeRow = typeof adminResourceNodes.$inferSelect
type ResourceAuditEventType =
  (typeof adminResourceAuditEvents.$inferInsert)["eventType"]

type ResourceAuditPayload =
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

export function createDrizzleResourceTreeRepository(
  db: WritingAppDatabase
): ResourceTreeRepository {
  return {
    async createNode(input) {
      return createNode(db, input)
    },
    async moveNode(input) {
      return moveNode(db, input)
    },
    async readChildren({ parentId }) {
      return readActiveChildren(db, parentId)
    },
    async readRevision() {
      return readTreeRevision(db)
    },
    async readSubtree(nodeId) {
      return readResourceSubtree(db, nodeId)
    },
    async renameNode(input) {
      return renameNode(db, input)
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
): CreateResourceNodeResult {
  return db.transaction(
    (transaction) => {
      const revisionRejection = validateTreeRevision(transaction, input)

      if (revisionRejection !== null) {
        return revisionRejection
      }

      const parentRejection = validateActiveParent(transaction, input.parentId)

      if (parentRejection !== null) {
        return parentRejection
      }

      const preferredName = normalizeResourceName(input.preferredName)

      if (preferredName.status === "invalid") {
        return {
          kind: "invalid-name",
          reason: preferredName.reason,
        } as const
      }

      const siblings = readActiveChildRows(transaction, input.parentId)
      const availableName = createAvailableResourceName(
        preferredName.name,
        siblings.map(({ normalizedName }) => normalizedName)
      )
      const nextRevision = reserveTreeRevision(transaction, input)
      const node: ResourceTreeNode =
        input.kind === "folder"
          ? {
              id: input.nodeId,
              kind: input.kind,
              name: availableName.name,
              normalizedName: availableName.normalizedName,
              parentId: input.parentId,
              sortOrder: siblings.length,
              status: "active",
              trashRootId: null,
            }
          : {
              id: input.nodeId,
              kind: input.kind,
              name: availableName.name,
              normalizedName: availableName.normalizedName,
              parentId: input.parentId,
              sortOrder: siblings.length,
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
          sortOrder: node.sortOrder,
          status: node.status,
          trashRootId: node.trashRootId,
          updatedAt: input.now,
          updatedBy: input.actorId,
        })
        .run()

      if (node.kind === "document") {
        transaction
          .insert(adminResourceDocuments)
          .values({ nodeId: node.id })
          .run()
      }

      insertAuditEvent(transaction, {
        actorId: input.actorId,
        auditEventId: input.auditEventId,
        eventType: "create",
        nodeId: node.id,
        now: input.now,
        payload: {
          kind: "create",
          name: node.name,
          nodeKind: node.kind,
          parentId: node.parentId,
        },
      })

      return {
        kind: "ok",
        value: {
          affectedParentIds: [node.parentId],
          node,
          revision: nextRevision,
        },
      }
    },
    { behavior: "immediate" }
  )
}

function renameNode(
  db: WritingAppDatabase,
  input: RenameResourceNodeInput
): RenameResourceNodeResult {
  return db.transaction(
    (transaction) => {
      const revisionRejection = validateTreeRevision(transaction, input)

      if (revisionRejection !== null) {
        return revisionRejection
      }

      const row = readActiveNodeRow(transaction, input.nodeId)

      if (row === undefined) {
        return { kind: "not-found" } as const
      }

      const nameValidation = validateResourceNameChange({
        currentNormalizedName: row.normalizedName,
        name: input.name,
        occupiedNormalizedNames: readActiveChildRows(
          transaction,
          toParentId(row.parentId),
          input.nodeId
        ).map(({ normalizedName }) => normalizedName),
      })

      if (nameValidation.status === "invalid") {
        return nameValidation.reason === "conflict"
          ? ({ kind: "name-conflict" } as const)
          : ({
              kind: "invalid-name",
              reason: nameValidation.reason,
            } as const)
      }

      const node = toResourceTreeNode(row)

      if (
        node.name === nameValidation.name &&
        node.normalizedName === nameValidation.normalizedName
      ) {
        return {
          kind: "ok",
          value: {
            affectedParentIds: [],
            node,
            revision: input.expectedRevision,
          },
        }
      }

      const nextRevision = reserveTreeRevision(transaction, input)
      const renamedNode = {
        ...node,
        name: nameValidation.name,
        normalizedName: nameValidation.normalizedName,
      }

      transaction
        .update(adminResourceNodes)
        .set({
          name: renamedNode.name,
          normalizedName: renamedNode.normalizedName,
          updatedAt: input.now,
          updatedBy: input.actorId,
        })
        .where(eq(adminResourceNodes.id, input.nodeId))
        .run()
      insertAuditEvent(transaction, {
        actorId: input.actorId,
        auditEventId: input.auditEventId,
        eventType: "rename",
        nodeId: input.nodeId,
        now: input.now,
        payload: {
          fromName: node.name,
          kind: "rename",
          toName: renamedNode.name,
        },
      })

      return {
        kind: "ok",
        value: {
          affectedParentIds: [node.parentId],
          node: renamedNode,
          revision: nextRevision,
        },
      }
    },
    { behavior: "immediate" }
  )
}

function moveNode(
  db: WritingAppDatabase,
  input: MoveResourceNodeInput
): MoveResourceNodeResult {
  return db.transaction(
    (transaction) => {
      const revisionRejection = validateTreeRevision(transaction, input)

      if (revisionRejection !== null) {
        return revisionRejection
      }

      const row = readActiveNodeRow(transaction, input.nodeId)

      if (row === undefined) {
        return { kind: "not-found" } as const
      }

      const parentRejection = validateActiveParent(
        transaction,
        input.destinationParentId
      )

      if (parentRejection !== null) {
        return parentRejection
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

      const moveValidation = validateResourceMove({
        destinationAncestorIds: readAncestorFolderIds(
          transaction,
          input.destinationParentId
        ),
        destinationParentId: input.destinationParentId,
        movingNodeId: input.nodeId,
      })

      if (moveValidation.status === "invalid") {
        return { kind: "cycle" } as const
      }

      if (
        !Number.isInteger(input.destinationIndex) ||
        input.destinationIndex < 0 ||
        input.destinationIndex > destinationSiblings.length
      ) {
        return { kind: "invalid-position" } as const
      }

      const sourceParentId = toParentId(row.parentId)
      const sourceSiblings = readActiveChildRows(
        transaction,
        sourceParentId,
        input.nodeId
      )
      const destinationNodeIds = destinationSiblings.map(({ id }) =>
        toResourceNodeIdFromRows(id, destinationSiblings)
      )
      destinationNodeIds.splice(input.destinationIndex, 0, input.nodeId)
      const destinationAssignments =
        createResourceSortAssignments(destinationNodeIds)
      const sourceAssignments =
        sourceParentId === input.destinationParentId
          ? []
          : createResourceSortAssignments(
              sourceSiblings.map(({ id }) =>
                toResourceNodeIdFromRows(id, sourceSiblings)
              )
            )
      const movingAssignment = destinationAssignments.find(
        ({ nodeId }) => nodeId === input.nodeId
      )

      if (movingAssignment === undefined) {
        throw new Error("이동할 자료의 새 정렬 위치를 계산하지 못했습니다.")
      }

      const node = toResourceTreeNode(row)
      const movedNode: ResourceTreeNode = {
        ...node,
        parentId: input.destinationParentId,
        sortOrder: movingAssignment.sortOrder,
      }

      if (
        node.parentId === movedNode.parentId &&
        node.sortOrder === movedNode.sortOrder
      ) {
        return {
          kind: "ok",
          value: {
            affectedParentIds: [],
            node,
            revision: input.expectedRevision,
          },
        }
      }

      const nextRevision = reserveTreeRevision(transaction, input)

      writeSortAssignments(transaction, sourceAssignments, input)
      writeSortAssignments(transaction, destinationAssignments, input)
      transaction
        .update(adminResourceNodes)
        .set({
          parentId: movedNode.parentId,
          sortOrder: movedNode.sortOrder,
          updatedAt: input.now,
          updatedBy: input.actorId,
        })
        .where(eq(adminResourceNodes.id, movedNode.id))
        .run()

      const eventType =
        sourceParentId === input.destinationParentId ? "reorder" : "move"
      insertAuditEvent(transaction, {
        actorId: input.actorId,
        auditEventId: input.auditEventId,
        eventType,
        nodeId: input.nodeId,
        now: input.now,
        payload: {
          fromIndex: node.sortOrder,
          fromParentId: node.parentId,
          kind: eventType,
          toIndex: movedNode.sortOrder,
          toParentId: movedNode.parentId,
        },
      })

      return {
        kind: "ok",
        value: {
          affectedParentIds: uniqueParentIds([
            sourceParentId,
            input.destinationParentId,
          ]),
          node: movedNode,
          revision: nextRevision,
        },
      }
    },
    { behavior: "immediate" }
  )
}

function trashNode(
  db: WritingAppDatabase,
  input: TrashResourceNodeInput
): TrashResourceNodeResult {
  return db.transaction(
    (transaction) => {
      const revisionRejection = validateTreeRevision(transaction, input)

      if (revisionRejection !== null) {
        return revisionRejection
      }

      const rootRow = readActiveNodeRow(transaction, input.nodeId)

      if (rootRow === undefined) {
        return { kind: "not-found" } as const
      }

      const subtree = readResourceSubtree(transaction, input.nodeId)
      const transition = archiveResourceSubtree(subtree, input.nodeId)

      if (transition.status === "invalid") {
        throw new Error("자료 하위 트리의 휴지통 상태를 계산하지 못했습니다.")
      }

      const sourceParentId = toParentId(rootRow.parentId)
      const sourceAssignments = createResourceSortAssignments(
        readActiveChildRows(transaction, sourceParentId, input.nodeId).map(
          ({ id }, _index, rows) => toResourceNodeIdFromRows(id, rows)
        )
      )
      const nextRevision = reserveTreeRevision(transaction, input)
      const counts = countResourceKinds(transition.nodes)

      writeSortAssignments(transaction, sourceAssignments, input)
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
          status = 'archived',
          trash_root_id = ${input.nodeId},
          updated_by = ${input.actorId},
          updated_at = ${input.now.getTime()}
        WHERE id IN (SELECT id FROM subtree)
      `)
      insertAuditEvent(transaction, {
        actorId: input.actorId,
        auditEventId: input.auditEventId,
        eventType: "trash",
        nodeId: input.nodeId,
        now: input.now,
        payload: { ...counts, kind: "trash" },
      })

      return {
        kind: "ok",
        value: {
          affectedParentIds: [sourceParentId],
          ...counts,
          revision: nextRevision,
        },
      }
    },
    { behavior: "immediate" }
  )
}

function restoreNode(
  db: WritingAppDatabase,
  input: RestoreResourceNodeInput
): RestoreResourceNodeResult {
  return db.transaction(
    (transaction) => {
      const revisionRejection = validateTreeRevision(transaction, input)

      if (revisionRejection !== null) {
        return revisionRejection
      }

      const rootRow = transaction
        .select()
        .from(adminResourceNodes)
        .where(
          and(
            eq(adminResourceNodes.id, input.nodeId),
            eq(adminResourceNodes.status, "archived"),
            eq(adminResourceNodes.trashRootId, input.nodeId)
          )
        )
        .get()

      if (rootRow === undefined) {
        return { kind: "not-found" } as const
      }

      const parentId = toParentId(rootRow.parentId)
      const parentRejection = validateActiveParent(transaction, parentId)

      if (parentRejection !== null) {
        return parentRejection
      }

      const archivedSubtree = readResourceSubtree(transaction, input.nodeId)
      const activeSiblings = readActiveChildRows(transaction, parentId)
      const transition = restoreResourceSubtree({
        nodes: archivedSubtree,
        occupiedTargetSiblingNormalizedNames: activeSiblings.map(
          ({ normalizedName }) => normalizedName
        ),
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

      const restoredIndex = Math.min(
        restoredRoot.sortOrder,
        activeSiblings.length
      )
      const restoredSiblingIds = activeSiblings.map(({ id }, _index, rows) =>
        toResourceNodeIdFromRows(id, rows)
      )
      restoredSiblingIds.splice(restoredIndex, 0, restoredRoot.id)
      const restoredAssignments =
        createResourceSortAssignments(restoredSiblingIds)
      const rootAssignment = restoredAssignments.find(
        ({ nodeId }) => nodeId === restoredRoot.id
      )

      if (rootAssignment === undefined) {
        throw new Error("복원할 자료의 정렬 위치를 계산하지 못했습니다.")
      }

      const nextRevision = reserveTreeRevision(transaction, input)
      const counts = countResourceKinds(transition.nodes)
      const restoredNode = {
        ...restoredRoot,
        sortOrder: rootAssignment.sortOrder,
      }

      transaction
        .update(adminResourceNodes)
        .set({
          name: restoredNode.name,
          normalizedName: restoredNode.normalizedName,
          sortOrder: restoredNode.sortOrder,
          updatedAt: input.now,
          updatedBy: input.actorId,
        })
        .where(eq(adminResourceNodes.id, restoredNode.id))
        .run()
      writeSortAssignments(transaction, restoredAssignments, input)
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
      insertAuditEvent(transaction, {
        actorId: input.actorId,
        auditEventId: input.auditEventId,
        eventType: "restore",
        nodeId: input.nodeId,
        now: input.now,
        payload: { ...counts, kind: "restore" },
      })

      return {
        kind: "ok",
        value: {
          affectedParentIds: [parentId],
          ...counts,
          node: restoredNode,
          revision: nextRevision,
        },
      }
    },
    { behavior: "immediate" }
  )
}

function validateTreeRevision(
  transaction: WritingAppDatabaseTransaction,
  input: { readonly expectedRevision: number }
): ResourceTreeCommandRejection | null {
  const actualRevision = readTreeRevision(transaction)

  return actualRevision === input.expectedRevision
    ? null
    : { actualRevision, kind: "stale-revision" }
}

function reserveTreeRevision(
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

function readTreeRevision(
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

function validateActiveParent(
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

function readActiveNodeRow(
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

function readActiveChildren(
  database: WritingAppDatabase | WritingAppDatabaseTransaction,
  parentId: ResourceFolderId | null
): readonly ResourceTreeNode[] {
  return readActiveChildRows(database, parentId).map(toResourceTreeNode)
}

function readActiveChildRows(
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

function readResourceSubtree(
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

function readAncestorFolderIds(
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

function writeSortAssignments(
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

function insertAuditEvent(
  transaction: WritingAppDatabaseTransaction,
  input: {
    readonly actorId: string
    readonly auditEventId: string
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

function toResourceTreeNode(row: ResourceNodeRow): ResourceTreeNode {
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

function toResourceNodeIdFromRows(
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

function toParentId(parentId: string | null): ResourceFolderId | null {
  return parentId === null ? null : toResourceFolderId(parentId)
}

function countResourceKinds(nodes: readonly ResourceTreeNode[]): {
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

function uniqueParentIds(
  parentIds: readonly (ResourceFolderId | null)[]
): readonly (ResourceFolderId | null)[] {
  return parentIds.filter(
    (parentId, index) => parentIds.indexOf(parentId) === index
  )
}
