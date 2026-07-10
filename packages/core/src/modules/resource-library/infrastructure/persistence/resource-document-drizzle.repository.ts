import { sql } from "drizzle-orm"

import type {
  ImportResourceDocumentInput,
  ImportResourceDocumentResult,
  ResourceDocumentRecord,
  ResourceDocumentRepository,
} from "@workspace/core/modules/resource-library/application/ports/resource-document.repository"
import {
  createAvailableResourceName,
  normalizeResourceName,
} from "@workspace/core/modules/resource-library/domain/resource-tree-policy"
import type {
  ResourceDocumentId,
  ResourceTreeNode,
} from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { toResourceFolderId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import {
  insertAuditEvent,
  insertResourceSearchIndex,
  parseResourceBreadcrumbPath,
  readActiveChildRows,
  reserveTreeRevision,
  validateActiveParent,
  validateTreeRevision,
  type WritingAppDatabaseTransaction,
} from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-library-drizzle.persistence"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  adminResourceDocuments,
  adminResourceNodes,
} from "@workspace/db/schema"

type ResourceDocumentQueryRow = {
  readonly content_markdown: string
  readonly content_revision: number
  readonly created_at: number
  readonly created_by_email: string
  readonly created_by_id: string
  readonly created_by_name: string
  readonly id: string
  readonly name: string
  readonly parent_id: string | null
  readonly path_json: string
  readonly status: ResourceDocumentRecord["status"]
  readonly updated_at: number
  readonly updated_by_email: string
  readonly updated_by_id: string
  readonly updated_by_name: string
}

export function createDrizzleResourceDocumentRepository(
  db: WritingAppDatabase
): ResourceDocumentRepository {
  return {
    async importDocument(input) {
      return importDocument(db, input)
    },
    async readDocument(documentId) {
      return readResourceDocumentRecord(db, documentId)
    },
  }
}

function importDocument(
  db: WritingAppDatabase,
  input: ImportResourceDocumentInput
): ImportResourceDocumentResult {
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

      const preferredName = normalizeResourceName(input.name)

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
      const node: ResourceTreeNode = {
        id: input.documentId,
        kind: "document",
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
      transaction
        .insert(adminResourceDocuments)
        .values({
          contentMarkdown: input.markdown,
          contentRevision: 0,
          nodeId: node.id,
        })
        .run()
      insertResourceSearchIndex(transaction, {
        bodyText: input.bodyText,
        kind: node.kind,
        name: node.name,
        nodeId: node.id,
      })
      insertAuditEvent(transaction, {
        actorId: input.actorId,
        auditEventId: input.auditEventId,
        eventType: "import",
        nodeId: node.id,
        now: input.now,
        payload: {
          kind: "import",
          name: node.name,
          parentId: node.parentId,
        },
      })

      const document = readResourceDocumentRecord(transaction, node.id)

      if (document === null) {
        throw new Error("가져온 자료 문서를 조회하지 못했습니다.")
      }

      return {
        kind: "ok",
        value: {
          document,
          mutation: {
            affectedParentIds: [node.parentId],
            node,
            revision: nextRevision,
          },
        },
      }
    },
    { behavior: "immediate" }
  )
}

function readResourceDocumentRecord(
  database: WritingAppDatabase | WritingAppDatabaseTransaction,
  documentId: ResourceDocumentId
): ResourceDocumentRecord | null {
  const row = database.all<ResourceDocumentQueryRow>(sql`
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
      document.content_markdown,
      document.content_revision,
      creator.id AS created_by_id,
      creator.name AS created_by_name,
      creator.email AS created_by_email,
      editor.id AS updated_by_id,
      editor.name AS updated_by_name,
      editor.email AS updated_by_email,
      paths.path_json
    FROM admin_resource_nodes AS node
    INNER JOIN admin_resource_documents AS document ON document.node_id = node.id
    INNER JOIN admin_user AS creator ON creator.id = node.created_by
    INNER JOIN admin_user AS editor ON editor.id = node.updated_by
    INNER JOIN paths ON paths.id = node.id
    WHERE node.id = ${documentId}
      AND node.kind = 'document'
  `)[0]

  if (row === undefined) {
    return null
  }

  return {
    contentMarkdown: row.content_markdown,
    contentRevision: row.content_revision,
    createdAt: new Date(row.created_at),
    createdBy: {
      email: row.created_by_email,
      id: row.created_by_id,
      name: row.created_by_name,
    },
    id: documentId,
    name: row.name,
    parentId: row.parent_id === null ? null : toResourceFolderId(row.parent_id),
    path: parseResourceBreadcrumbPath(row.path_json),
    status: row.status,
    updatedAt: new Date(row.updated_at),
    updatedBy: {
      email: row.updated_by_email,
      id: row.updated_by_id,
      name: row.updated_by_name,
    },
  }
}
