import { and, eq } from "drizzle-orm"

import type { ResourceAssetRepository } from "@workspace/core/resource-library"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  adminResourceAssets,
  adminResourceDocuments,
  adminResourceNodes,
} from "@workspace/db/schema"

export function createDrizzleResourceAssetRepository(
  db: WritingAppDatabase
): ResourceAssetRepository {
  return {
    async createAsset(input) {
      return db.transaction((transaction) => {
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

        if (document === undefined) return { kind: "not-found" } as const

        transaction
          .insert(adminResourceAssets)
          .values({
            byteSize: input.byteSize,
            contentType: input.contentType,
            createdAt: input.createdAt,
            documentId: input.documentId,
            id: input.id,
            r2ObjectKey: input.objectKey,
          })
          .run()

        return { kind: "ok" } as const
      })
    },
  }
}
