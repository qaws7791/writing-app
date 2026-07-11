import { and, asc, eq, gt, lte } from "drizzle-orm"

import type {
  CommitResourceDocumentTransactionInput,
  CommitResourceDocumentTransactionResult,
  ResourceDocumentSyncLoadResult,
  ResourceDocumentSyncRepository,
} from "@workspace/core/modules/resource-library/application/ports/resource-document-sync.repository"
import type { ResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { updateResourceSearchBody } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-library-drizzle.persistence"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  adminResourceCollaboration,
  adminResourceCollaborationTransactions,
  adminResourceCollaborationUpdates,
  adminResourceDocuments,
  adminResourceNodes,
} from "@workspace/db/schema"

export function createDrizzleResourceDocumentSyncRepository(
  db: WritingAppDatabase
): ResourceDocumentSyncRepository {
  return {
    async commitTransaction(input) {
      return commitResourceDocumentTransaction(db, input)
    },
    async findAcceptedTransaction(input) {
      const accepted = db
        .select({
          contentRevision:
            adminResourceCollaborationTransactions.contentRevision,
          stateVersion: adminResourceCollaborationTransactions.stateVersion,
        })
        .from(adminResourceCollaborationTransactions)
        .where(
          and(
            eq(
              adminResourceCollaborationTransactions.documentId,
              input.documentId
            ),
            eq(
              adminResourceCollaborationTransactions.transactionId,
              input.transactionId
            )
          )
        )
        .get()

      if (accepted === undefined) return undefined
      return {
        contentRevision: accepted.contentRevision,
        kind: "already-accepted",
        stateVersion: accepted.stateVersion,
        transactionId: input.transactionId,
      }
    },
    async loadDocument(documentId) {
      return loadResourceDocumentSync(db, documentId)
    },
    async readUpdates(input) {
      return db
        .select({
          stateVersion: adminResourceCollaborationUpdates.stateVersion,
          update: adminResourceCollaborationUpdates.yjsUpdate,
        })
        .from(adminResourceCollaborationUpdates)
        .where(
          and(
            eq(adminResourceCollaborationUpdates.documentId, input.documentId),
            gt(
              adminResourceCollaborationUpdates.stateVersion,
              input.afterStateVersion
            )
          )
        )
        .orderBy(asc(adminResourceCollaborationUpdates.stateVersion))
        .all()
        .map((row) => ({
          stateVersion: row.stateVersion,
          update: Uint8Array.from(row.update.values()),
        }))
    },
  }
}

function loadResourceDocumentSync(
  db: WritingAppDatabase,
  documentId: ResourceDocumentId
): ResourceDocumentSyncLoadResult {
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

function commitResourceDocumentTransaction(
  db: WritingAppDatabase,
  input: CommitResourceDocumentTransactionInput
): CommitResourceDocumentTransactionResult {
  return db.transaction(
    (transaction) => {
      const accepted = transaction
        .select({
          contentRevision:
            adminResourceCollaborationTransactions.contentRevision,
          stateVersion: adminResourceCollaborationTransactions.stateVersion,
        })
        .from(adminResourceCollaborationTransactions)
        .where(
          and(
            eq(
              adminResourceCollaborationTransactions.documentId,
              input.documentId
            ),
            eq(
              adminResourceCollaborationTransactions.transactionId,
              input.transactionId
            )
          )
        )
        .get()

      if (accepted !== undefined) {
        return {
          contentRevision: accepted.contentRevision,
          kind: "already-accepted",
          stateVersion: accepted.stateVersion,
          transactionId: input.transactionId,
        }
      }

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
        return { actualStateVersion, kind: "stale-state-version" }
      }

      const stateVersion = actualStateVersion + 1
      const contentRevision = current.contentRevision + 1
      const snapshot = Buffer.from(input.snapshot)

      if (current.stateVersion === null) {
        transaction
          .insert(adminResourceCollaboration)
          .values({
            documentId: input.documentId,
            projectedAt: input.now,
            stateVersion,
            yjsState: snapshot,
          })
          .run()
      } else {
        transaction
          .update(adminResourceCollaboration)
          .set({
            projectedAt: input.now,
            stateVersion,
            yjsState: snapshot,
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
        .insert(adminResourceCollaborationUpdates)
        .values({
          actorId: input.actorId,
          contentRevision,
          createdAt: input.now,
          documentId: input.documentId,
          stateVersion,
          transactionId: input.transactionId,
          yjsUpdate: Buffer.from(input.update),
        })
        .run()
      transaction
        .insert(adminResourceCollaborationTransactions)
        .values({
          actorId: input.actorId,
          contentRevision,
          createdAt: input.now,
          documentId: input.documentId,
          stateVersion,
          transactionId: input.transactionId,
        })
        .run()

      const storedUpdates = transaction
        .select({
          stateVersion: adminResourceCollaborationUpdates.stateVersion,
          update: adminResourceCollaborationUpdates.yjsUpdate,
        })
        .from(adminResourceCollaborationUpdates)
        .where(
          eq(adminResourceCollaborationUpdates.documentId, input.documentId)
        )
        .orderBy(asc(adminResourceCollaborationUpdates.stateVersion))
        .all()
      let remainingBytes = storedUpdates.reduce(
        (total, storedUpdate) => total + storedUpdate.update.byteLength,
        0
      )
      let remainingCount = storedUpdates.length
      let removeThroughStateVersion: number | undefined

      for (const storedUpdate of storedUpdates) {
        if (remainingCount <= 200 && remainingBytes <= 2 * 1024 * 1024) break
        if (remainingCount <= 1) break

        remainingBytes -= storedUpdate.update.byteLength
        remainingCount -= 1
        removeThroughStateVersion = storedUpdate.stateVersion
      }

      if (removeThroughStateVersion !== undefined) {
        transaction
          .delete(adminResourceCollaborationUpdates)
          .where(
            and(
              eq(
                adminResourceCollaborationUpdates.documentId,
                input.documentId
              ),
              lte(
                adminResourceCollaborationUpdates.stateVersion,
                removeThroughStateVersion
              )
            )
          )
          .run()
      }

      transaction
        .update(adminResourceDocuments)
        .set({ contentMarkdown: input.markdown, contentRevision })
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
        contentRevision,
        kind: "accepted",
        stateVersion,
        transactionId: input.transactionId,
      }
    },
    { behavior: "immediate" }
  )
}
