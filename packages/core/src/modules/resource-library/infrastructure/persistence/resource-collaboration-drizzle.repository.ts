import { and, eq } from "drizzle-orm"

import type {
  FlushResourceCollaborationInput,
  ResourceCollaborationFlushResult,
  ResourceCollaborationLoadResult,
  ResourceCollaborationRepository,
} from "@workspace/core/modules/resource-library/application/ports/resource-collaboration.repository"
import type { ResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { updateResourceSearchBody } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-library-drizzle.persistence"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  adminResourceCollaboration,
  adminResourceDocuments,
  adminResourceNodes,
} from "@workspace/db/schema"

export function createDrizzleResourceCollaborationRepository(
  db: WritingAppDatabase
): ResourceCollaborationRepository {
  return {
    async flush(input) {
      return flushResourceCollaboration(db, input)
    },
    async load(documentId) {
      return loadResourceCollaboration(db, documentId)
    },
  }
}

function loadResourceCollaboration(
  db: WritingAppDatabase,
  documentId: ResourceDocumentId
): ResourceCollaborationLoadResult {
  const row = db
    .select({
      contentMarkdown: adminResourceDocuments.contentMarkdown,
      snapshot: adminResourceCollaboration.yjsState,
      stateVersion: adminResourceCollaboration.stateVersion,
      status: adminResourceNodes.status,
    })
    .from(adminResourceDocuments)
    .innerJoin(
      adminResourceNodes,
      eq(adminResourceNodes.id, adminResourceDocuments.nodeId)
    )
    .leftJoin(
      adminResourceCollaboration,
      eq(adminResourceCollaboration.documentId, adminResourceDocuments.nodeId)
    )
    .where(
      and(
        eq(adminResourceDocuments.nodeId, documentId),
        eq(adminResourceNodes.kind, "document")
      )
    )
    .get()

  if (row === undefined) return { kind: "not-found" }
  if (row.status !== "active") return { kind: "inactive" }

  return {
    kind: "ok",
    value: {
      contentMarkdown: row.contentMarkdown,
      snapshot:
        row.snapshot === null ? null : Uint8Array.from(row.snapshot.values()),
      stateVersion: row.stateVersion ?? 0,
    },
  }
}

function flushResourceCollaboration(
  db: WritingAppDatabase,
  input: FlushResourceCollaborationInput
): ResourceCollaborationFlushResult {
  return db.transaction(
    (transaction) => {
      const current = transaction
        .select({
          contentRevision: adminResourceDocuments.contentRevision,
          stateVersion: adminResourceCollaboration.stateVersion,
          status: adminResourceNodes.status,
        })
        .from(adminResourceDocuments)
        .innerJoin(
          adminResourceNodes,
          eq(adminResourceNodes.id, adminResourceDocuments.nodeId)
        )
        .leftJoin(
          adminResourceCollaboration,
          eq(
            adminResourceCollaboration.documentId,
            adminResourceDocuments.nodeId
          )
        )
        .where(
          and(
            eq(adminResourceDocuments.nodeId, input.documentId),
            eq(adminResourceNodes.kind, "document")
          )
        )
        .get()

      if (current === undefined) return { kind: "not-found" }
      if (current.status !== "active") return { kind: "inactive" }

      const actualStateVersion = current.stateVersion ?? 0

      if (actualStateVersion !== input.expectedStateVersion) {
        return {
          actualStateVersion,
          kind: "stale-state-version",
        }
      }

      const nextStateVersion = actualStateVersion + 1
      const nextContentRevision = current.contentRevision + 1
      const yjsState = Buffer.from(input.snapshot)

      if (current.stateVersion === null) {
        transaction
          .insert(adminResourceCollaboration)
          .values({
            documentId: input.documentId,
            projectedAt: input.now,
            stateVersion: nextStateVersion,
            yjsState,
          })
          .run()
      } else {
        transaction
          .update(adminResourceCollaboration)
          .set({
            projectedAt: input.now,
            stateVersion: nextStateVersion,
            yjsState,
          })
          .where(
            and(
              eq(adminResourceCollaboration.documentId, input.documentId),
              eq(
                adminResourceCollaboration.stateVersion,
                input.expectedStateVersion
              )
            )
          )
          .run()
      }

      transaction
        .update(adminResourceDocuments)
        .set({
          contentMarkdown: input.markdown,
          contentRevision: nextContentRevision,
        })
        .where(eq(adminResourceDocuments.nodeId, input.documentId))
        .run()
      transaction
        .update(adminResourceNodes)
        .set({ updatedAt: input.now, updatedBy: input.actorId })
        .where(eq(adminResourceNodes.id, input.documentId))
        .run()
      updateResourceSearchBody(transaction, {
        bodyText: input.bodyText,
        nodeId: input.documentId,
      })

      return {
        kind: "ok",
        value: {
          contentRevision: nextContentRevision,
          stateVersion: nextStateVersion,
        },
      }
    },
    { behavior: "immediate" }
  )
}
