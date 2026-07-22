import { and, asc, eq, isNull, ne, sql } from "drizzle-orm"

import type {
  ImportResourceDocumentInput,
  ImportResourceDocumentResult,
  ResourceDocumentRecord,
  ResourceDocumentRepository,
  SaveResourceDocumentInput,
  SaveResourceDocumentResult,
} from "@workspace/core/resource-library"
import {
  createAvailableResourceName,
  normalizeResourceName,
  validateResourceNameChange,
} from "@workspace/core/resource-library"
import {
  parseResourceBreadcrumbPath,
  toResourceDocumentId,
  toResourceFolderId,
  type ResourceDocumentId,
  type ResourceFolderId,
} from "@workspace/core/resource-library"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  adminResourceDocuments,
  adminResourceNodes,
} from "@workspace/db/schema"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"

type DatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

type DocumentQueryRow = {
  readonly content_markdown: string
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
  readonly version: number
}

export function createDrizzleResourceDocumentRepository(
  db: WritingAppDatabase
): ResourceDocumentRepository {
  return {
    async importDocument(input) {
      return importDocument(db, input)
    },
    async readDocument(documentId) {
      return readResourceDocument(db, documentId)
    },
    async saveDocument(input) {
      return saveDocument(db, input)
    },
  }
}

function importDocument(
  db: WritingAppDatabase,
  input: ImportResourceDocumentInput
): ImportResourceDocumentResult {
  return db.transaction(
    (transaction) => {
      const nodeCount = transaction
        .select({ value: sql<number>`count(*)` })
        .from(adminResourceNodes)
        .get()?.value
      if ((nodeCount ?? 0) >= 1_000) return { kind: "node-limit" } as const

      if (!isActiveFolder(transaction, input.parentId)) {
        return { kind: "parent-not-found" } as const
      }

      const preferredName = normalizeResourceName(input.name)
      if (preferredName.status === "invalid") {
        return {
          kind: "invalid-name",
          reason: preferredName.reason,
        } as const
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

      return {
        kind: "ok",
        value: {
          document,
          node: {
            id: input.documentId,
            kind: "document",
            name: name.name,
            normalizedName: name.normalizedName,
            parentId: input.parentId,
            status: "active",
            trashRootId: null,
          },
        },
      } as const
    },
    { behavior: "immediate" }
  )
}

function saveDocument(
  db: WritingAppDatabase,
  input: SaveResourceDocumentInput
): SaveResourceDocumentResult {
  return db.transaction(
    (transaction) => {
      const current = readResourceDocument(transaction, input.documentId)
      if (current === null || current.status !== "active") {
        return { kind: "not-found" } as const
      }
      if (current.version !== input.expectedVersion) {
        return { document: current, kind: "conflict" } as const
      }

      const node = transaction
        .select({
          normalizedName: adminResourceNodes.normalizedName,
          parentId: adminResourceNodes.parentId,
        })
        .from(adminResourceNodes)
        .where(eq(adminResourceNodes.id, input.documentId))
        .get()
      if (node === undefined) return { kind: "not-found" } as const

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
          ? ({ kind: "name-conflict" } as const)
          : ({
              kind: "invalid-name",
              reason: nameValidation.reason,
            } as const)
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
        if (latest === null) return { kind: "not-found" } as const
        return { document: latest, kind: "conflict" } as const
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
      if (saved === null)
        throw new Error("저장한 자료 문서를 조회하지 못했습니다.")
      return { document: saved, kind: "ok" } as const
    },
    { behavior: "immediate" }
  )
}

function readResourceDocument(
  db: WritingAppDatabase | DatabaseTransaction,
  documentId: ResourceDocumentId
): ResourceDocumentRecord | null {
  const row = db.all<DocumentQueryRow>(sql`
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
      document.version,
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
  if (row === undefined) return null

  return {
    contentMarkdown: row.content_markdown,
    createdAt: new Date(row.created_at),
    createdBy: {
      email: row.created_by_email,
      id: adminIdSchema.parse(row.created_by_id),
      name: row.created_by_name,
    },
    id: toResourceDocumentId(row.id),
    name: row.name,
    parentId: toParentId(row.parent_id),
    path: parseResourceBreadcrumbPath(row.path_json),
    status: row.status,
    updatedAt: new Date(row.updated_at),
    updatedBy: {
      email: row.updated_by_email,
      id: adminIdSchema.parse(row.updated_by_id),
      name: row.updated_by_name,
    },
    version: row.version,
  }
}

function readActiveSiblings(
  transaction: DatabaseTransaction,
  parentId: ResourceFolderId | null,
  excludedDocumentId?: ResourceDocumentId
): readonly { readonly normalizedName: string }[] {
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

function toParentId(value: string | null): ResourceFolderId | null {
  return value === null ? null : toResourceFolderId(value)
}
