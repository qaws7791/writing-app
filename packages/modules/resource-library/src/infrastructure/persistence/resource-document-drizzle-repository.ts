import { and, asc, eq, isNull, ne, sql } from "drizzle-orm"
import type { AdminId, ResourceDocumentId } from "@workspace/types/ids"
import type { WritingAppDatabase } from "@workspace/db/client"

import type {
  ResourceCommandResult,
  ResourceDocumentRepository,
} from "#resource-library/application/ports/resource-library-ports"
import type { ResourceDocumentRecord } from "#resource-library/domain/resource-document"
import {
  createAvailableResourceName,
  normalizeResourceName,
  resourceMaxNodeCount,
  validateResourceNameChange,
} from "#resource-library/domain/resource-tree-policy"
import {
  parseResourceBreadcrumbPath,
  readResourceDocumentId,
  readResourceFolderId,
  type ResourceFolderId,
  type ResourceTreeNode,
} from "#resource-library/domain/resource-tree-node"
import {
  adminResourceDocuments,
  adminResourceNodes,
} from "#resource-library/infrastructure/persistence/schema"

type DatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

type DocumentQueryRow = Readonly<{
  content_markdown: string
  created_at: number
  created_by_id: string
  id: string
  name: string
  parent_id: string | null
  path_json: string
  status: ResourceDocumentRecord["status"]
  updated_at: number
  updated_by_id: string
  version: number
}>

export function createDrizzleResourceDocumentRepository(
  database: WritingAppDatabase
): ResourceDocumentRepository {
  return Object.freeze({
    async importDocument(input) {
      return importDocument(database, input)
    },
    async readDocument(documentId) {
      return readResourceDocument(database, documentId)
    },
    async saveDocument(input) {
      return saveDocument(database, input)
    },
  })
}

function importDocument(
  database: WritingAppDatabase,
  input: Parameters<ResourceDocumentRepository["importDocument"]>[0]
): Awaited<ReturnType<ResourceDocumentRepository["importDocument"]>> {
  return database.transaction(
    (transaction) => {
      const nodeCount = transaction
        .select({ value: sql<number>`count(*)` })
        .from(adminResourceNodes)
        .get()?.value
      if ((nodeCount ?? 0) >= resourceMaxNodeCount) {
        return validationError("node-limit")
      }
      if (!isActiveFolder(transaction, input.parentId)) {
        return { kind: "resource-not-found", target: "parent" } as const
      }

      const preferredName = normalizeResourceName(input.name)
      if (preferredName.status === "invalid") {
        return nameValidationError(preferredName.reason)
      }
      const siblings = readActiveSiblings(transaction, input.parentId)
      const name = createAvailableResourceName(
        preferredName.name,
        siblings.map(({ normalizedName }) => normalizedName)
      )

      transaction
        .insert(adminResourceNodes)
        .values({
          createdAt: input.now,
          createdBy: input.actorId,
          id: input.documentId,
          kind: "document",
          name: name.name,
          normalizedName: name.normalizedName,
          parentId: input.parentId,
          status: "active",
          trashRootId: null,
          updatedAt: input.now,
          updatedBy: input.actorId,
        })
        .run()
      transaction
        .insert(adminResourceDocuments)
        .values({
          contentMarkdown: input.markdown,
          nodeId: input.documentId,
          version: 0,
        })
        .run()
      transaction.run(sql`
        INSERT INTO admin_resource_search (node_id, name, body_text)
        VALUES (${input.documentId}, ${name.name}, ${input.bodyText})
      `)

      const document = readResourceDocument(transaction, input.documentId)
      if (document === null) {
        throw new Error("가져온 자료 문서를 조회하지 못했습니다.")
      }
      const node: ResourceTreeNode = {
        id: input.documentId,
        kind: "document",
        name: name.name,
        normalizedName: name.normalizedName,
        parentId: input.parentId,
        status: "active",
        trashRootId: null,
      }
      return { kind: "ok", value: { document, node } } as const
    },
    { behavior: "immediate" }
  )
}

function saveDocument(
  database: WritingAppDatabase,
  input: Parameters<ResourceDocumentRepository["saveDocument"]>[0]
): Awaited<ReturnType<ResourceDocumentRepository["saveDocument"]>> {
  return database.transaction(
    (transaction) => {
      const current = readResourceDocument(transaction, input.documentId)
      if (current === null || current.status !== "active") {
        return { kind: "resource-not-found", target: "document" } as const
      }
      if (current.version !== input.expectedVersion) {
        return { document: current, kind: "stale-version" } as const
      }

      const node = transaction
        .select({
          normalizedName: adminResourceNodes.normalizedName,
          parentId: adminResourceNodes.parentId,
        })
        .from(adminResourceNodes)
        .where(eq(adminResourceNodes.id, input.documentId))
        .get()
      if (node === undefined) {
        return { kind: "resource-not-found", target: "document" } as const
      }

      const nameValidation = validateResourceNameChange({
        currentNormalizedName: node.normalizedName,
        name: input.name,
        occupiedNormalizedNames: readActiveSiblings(
          transaction,
          toParentId(node.parentId),
          input.documentId
        ).map(({ normalizedName }) => normalizedName),
      })
      if (nameValidation.status === "invalid") {
        return nameValidation.reason === "conflict"
          ? ({
              kind: "resource-conflict",
              reason: "name-conflict",
            } as const)
          : nameValidationError(nameValidation.reason)
      }

      transaction
        .update(adminResourceDocuments)
        .set({
          contentMarkdown: input.contentMarkdown,
          version: sql`${adminResourceDocuments.version} + 1`,
        })
        .where(
          and(
            eq(adminResourceDocuments.nodeId, input.documentId),
            eq(adminResourceDocuments.version, input.expectedVersion)
          )
        )
        .run()
      const changed = transaction
        .select({ value: sql<number>`changes()` })
        .from(sql`(SELECT 1)`)
        .get()?.value
      if (changed !== 1) {
        const latest = readResourceDocument(transaction, input.documentId)
        return latest === null
          ? ({ kind: "resource-not-found", target: "document" } as const)
          : ({ document: latest, kind: "stale-version" } as const)
      }

      transaction
        .update(adminResourceNodes)
        .set({
          name: nameValidation.name,
          normalizedName: nameValidation.normalizedName,
          updatedAt: input.now,
          updatedBy: input.actorId,
        })
        .where(eq(adminResourceNodes.id, input.documentId))
        .run()
      transaction.run(sql`
        UPDATE admin_resource_search
        SET name = ${nameValidation.name}, body_text = ${input.bodyText}
        WHERE node_id = ${input.documentId}
      `)

      const saved = readResourceDocument(transaction, input.documentId)
      if (saved === null) {
        throw new Error("저장한 자료 문서를 조회하지 못했습니다.")
      }
      return { kind: "ok", value: saved } as const
    },
    { behavior: "immediate" }
  )
}

function readResourceDocument(
  database: WritingAppDatabase | DatabaseTransaction,
  documentId: ResourceDocumentId
): ResourceDocumentRecord | null {
  const row = database.all<DocumentQueryRow>(sql`
    WITH RECURSIVE paths(id, path_json) AS (
      SELECT id, json_array()
      FROM admin_resource_nodes
      WHERE parent_id IS NULL
      UNION ALL
      SELECT
        child.id,
        json_insert(
          parent.path_json,
          '$[#]',
          json_object('id', parent_node.id, 'name', parent_node.name)
        )
      FROM admin_resource_nodes AS child
      INNER JOIN paths AS parent ON child.parent_id = parent.id
      INNER JOIN admin_resource_nodes AS parent_node ON parent_node.id = parent.id
    )
    SELECT
      node.id,
      node.name,
      node.parent_id,
      node.status,
      node.created_at,
      node.updated_at,
      node.created_by AS created_by_id,
      node.updated_by AS updated_by_id,
      document.content_markdown,
      document.version,
      paths.path_json
    FROM admin_resource_nodes AS node
    INNER JOIN admin_resource_documents AS document ON document.node_id = node.id
    INNER JOIN paths ON paths.id = node.id
    WHERE node.id = ${documentId}
      AND node.kind = 'document'
  `)[0]
  if (row === undefined) return null

  return Object.freeze({
    contentMarkdown: row.content_markdown,
    createdAt: new Date(row.created_at),
    createdById: readAdminId(row.created_by_id),
    id: readResourceDocumentId(row.id),
    name: row.name,
    parentId: toParentId(row.parent_id),
    path: parseResourceBreadcrumbPath(row.path_json),
    status: row.status,
    updatedAt: new Date(row.updated_at),
    updatedById: readAdminId(row.updated_by_id),
    version: row.version,
  })
}

function readActiveSiblings(
  transaction: DatabaseTransaction,
  parentId: ResourceFolderId | null,
  excludedDocumentId?: ResourceDocumentId
): readonly Readonly<{ normalizedName: string }>[] {
  return transaction
    .select({ normalizedName: adminResourceNodes.normalizedName })
    .from(adminResourceNodes)
    .where(
      and(
        parentId === null
          ? isNull(adminResourceNodes.parentId)
          : eq(adminResourceNodes.parentId, parentId),
        eq(adminResourceNodes.status, "active"),
        excludedDocumentId === undefined
          ? undefined
          : ne(adminResourceNodes.id, excludedDocumentId)
      )
    )
    .orderBy(asc(adminResourceNodes.normalizedName))
    .all()
}

function isActiveFolder(
  transaction: DatabaseTransaction,
  parentId: ResourceFolderId | null
): boolean {
  if (parentId === null) return true
  return (
    transaction
      .select({ id: adminResourceNodes.id })
      .from(adminResourceNodes)
      .where(
        and(
          eq(adminResourceNodes.id, parentId),
          eq(adminResourceNodes.kind, "folder"),
          eq(adminResourceNodes.status, "active")
        )
      )
      .get() !== undefined
  )
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

function validationError(reason: "node-limit"): ResourceCommandResult<never> {
  return { kind: "resource-validation", reason }
}

function toParentId(value: string | null): ResourceFolderId | null {
  return value === null ? null : readResourceFolderId(value)
}

function readAdminId(value: string): AdminId {
  return value as AdminId
}
