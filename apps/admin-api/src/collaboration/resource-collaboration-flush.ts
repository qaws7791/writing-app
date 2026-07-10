import {
  toResourceDocumentId,
  type ResourceCollaborationStateIssue,
  type ResourceCollaborationUseCase,
} from "@workspace/core/modules/resource-library/api"

import type {
  YWebSocketRoomFlushInput,
  YWebSocketRoomFlushResult,
} from "@/collaboration/y-websocket-bun-adapter"

export type ResourceCollaborationFlushFailure = {
  readonly failure:
    | "database-busy"
    | "inactive"
    | "invalid-state"
    | "not-found"
    | "persistence-error"
    | "stale-state-version"
  readonly message?: string
  readonly issues?: readonly ResourceCollaborationStateIssue[]
  readonly reason: YWebSocketRoomFlushInput["reason"]
  readonly roomId: string
}

export type ResourceCollaborationFlushHandler = (
  input: YWebSocketRoomFlushInput
) => Promise<YWebSocketRoomFlushResult>

export function createResourceCollaborationFlushHandler(input: {
  readonly collaborationService: ResourceCollaborationUseCase
  readonly now: () => Date
  readonly onFailure: (failure: ResourceCollaborationFlushFailure) => void
}): ResourceCollaborationFlushHandler {
  return async (flush) => {
    try {
      const result = await input.collaborationService.flush({
        actorId: flush.actorId,
        documentId: toResourceDocumentId(flush.roomId),
        expectedStateVersion: flush.expectedStateVersion,
        now: input.now(),
        snapshot: flush.snapshot,
      })

      if (result.kind === "ok") {
        return { kind: "ok", stateVersion: result.value.stateVersion }
      }

      input.onFailure({
        failure: result.kind,
        ...(result.kind === "invalid-state" ? { issues: result.issues } : {}),
        reason: flush.reason,
        roomId: flush.roomId,
      })
      return { kind: "error" }
    } catch (error) {
      input.onFailure({
        failure: isSqliteBusyError(error)
          ? "database-busy"
          : "persistence-error",
        message:
          error instanceof Error
            ? error.message
            : "알 수 없는 저장 오류가 발생했습니다.",
        reason: flush.reason,
        roomId: flush.roomId,
      })
      return { kind: "error" }
    }
  }
}

function isSqliteBusyError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "SQLiteError" &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("SQLITE_BUSY")
  )
}
