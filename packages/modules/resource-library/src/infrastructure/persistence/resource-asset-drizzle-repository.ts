import { and, eq } from "drizzle-orm"
import type { WritingAppDatabase } from "@workspace/db/client"

import type { ResourceAssetRepository } from "#resource-library/application/ports/resource-library-ports"
import {
  adminResourceAssets,
  adminResourceDocuments,
  adminResourceNodes,
} from "#resource-library/infrastructure/persistence/schema"

export function createDrizzleResourceAssetRepository(
  database: WritingAppDatabase
): ResourceAssetRepository {
  return Object.freeze({
    async createAsset(input) {
      return database.transaction((transaction) => {
        const document = transaction
          .select({ id: adminResourceDocuments.nodeId })
          .from(adminResourceDocuments)
          .innerJoin(
            adminResourceNodes,
            eq(adminResourceNodes.id, adminResourceDocuments.nodeId)
          )
          .where(
            and(
              eq(adminResourceDocuments.nodeId, input.documentId),
              eq(adminResourceNodes.status, "active")
            )
          )
          .get()
        if (document === undefined) {
          return { kind: "document-not-found" } as const
        }

        transaction
          .insert(adminResourceAssets)
          .values({
            altText: input.altText,
            byteSize: input.byteSize,
            contentType: input.contentType,
            createdAt: input.createdAt,
            deleteRequestedAt: null,
            deleteRequestedBy: null,
            deleteRootId: null,
            documentId: input.documentId,
            id: input.id,
            objectKey: input.objectKey,
            status: "active",
          })
          .run()
        return { kind: "ok" } as const
      })
    },
  })
}
