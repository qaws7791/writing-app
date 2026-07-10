import type { ResourceDocumentId } from "@workspace/core/modules/resource-library/api"

import type { YWebSocketBunAdapter } from "@/collaboration/y-websocket-bun-adapter"

export type ResourceCollaborationRoomLock = {
  readonly documentIds: readonly ResourceDocumentId[]
}

export type ResourceCollaborationRooms = {
  readonly close: (lock: ResourceCollaborationRoomLock) => number
  readonly countActiveEditors: (
    documentIds: readonly ResourceDocumentId[]
  ) => number
  readonly flushDocument: (
    documentId: ResourceDocumentId
  ) => Promise<"error" | "ok">
  readonly lockDocuments: (
    documentIds: readonly ResourceDocumentId[]
  ) => Promise<
    | { readonly kind: "error" }
    | {
        readonly kind: "ok"
        readonly lock: ResourceCollaborationRoomLock
      }
  >
  readonly release: (lock: ResourceCollaborationRoomLock) => void
}

export function createResourceCollaborationRooms(
  adapter: YWebSocketBunAdapter
): ResourceCollaborationRooms {
  return {
    close(lock) {
      let closedActiveRoomCount = 0

      for (const documentId of lock.documentIds) {
        const closedConnectionCount = adapter.closeRoom(
          documentId,
          1008,
          "자료 문서가 휴지통으로 이동했습니다."
        )

        if (closedConnectionCount > 0) closedActiveRoomCount += 1
      }

      return closedActiveRoomCount
    },
    countActiveEditors(documentIds) {
      return documentIds.reduce(
        (count, documentId) =>
          count + adapter.getRoomConnectionCount(documentId),
        0
      )
    },
    async flushDocument(documentId) {
      const result = await adapter.flushRoom(documentId)

      return result === "error" ? "error" : "ok"
    },
    async lockDocuments(documentIds) {
      const lockedDocumentIds: ResourceDocumentId[] = []

      for (const documentId of documentIds) {
        const result = await adapter.lockRoom(documentId)

        if (result === "not-open") continue

        if (result === "error") {
          for (const lockedDocumentId of lockedDocumentIds) {
            adapter.unlockRoom(lockedDocumentId)
          }

          return { kind: "error" }
        }

        lockedDocumentIds.push(documentId)
      }

      return {
        kind: "ok",
        lock: { documentIds: lockedDocumentIds },
      }
    },
    release(lock) {
      for (const documentId of lock.documentIds) {
        adapter.unlockRoom(documentId)
      }
    },
  }
}
