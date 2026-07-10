import {
  toResourceDocumentId,
  type ResourceCollaborationUseCase,
} from "@workspace/core/modules/resource-library/api"

import type { AdminSessionResolver } from "@/auth/admin-session"
import {
  authorizeResourceWebSocket,
  type ResourceWebSocketAuthorizationRejectionReason,
} from "@/collaboration/resource-websocket-authorization"
import type { YWebSocketConnectionData } from "@/collaboration/y-websocket-bun-adapter"

export type ResourceCollaborationUpgrade = (
  request: Request,
  data: YWebSocketConnectionData
) => boolean

export type ResourceCollaborationUpgradeHandler = (
  request: Request,
  upgrade: ResourceCollaborationUpgrade
) => Promise<Response | null | undefined>

export function createResourceCollaborationUpgradeHandler(input: {
  readonly adminOrigin: string
  readonly collaborationService: ResourceCollaborationUseCase
  readonly onAuthorizationRejected: (
    reason: ResourceWebSocketAuthorizationRejectionReason
  ) => void
  readonly sessionResolver: AdminSessionResolver
}): ResourceCollaborationUpgradeHandler {
  return async (request, upgrade) => {
    const resourceDocumentId = readResourceDocumentId(request.url)

    if (resourceDocumentId === null) return null

    const authorization = await authorizeResourceWebSocket({
      adminOrigin: input.adminOrigin,
      request,
      sessionResolver: input.sessionResolver,
    })

    if (authorization.kind === "error") {
      input.onAuthorizationRejected(authorization.reason)
      return authorization.response
    }

    const prepared = await input.collaborationService.prepare({
      documentId: resourceDocumentId,
    })

    if (prepared.kind === "not-found") {
      return new Response("자료 문서를 찾지 못했습니다.", { status: 404 })
    }

    if (prepared.kind === "inactive") {
      return new Response("보관된 자료 문서는 편집할 수 없습니다.", {
        status: 409,
      })
    }

    if (prepared.kind === "invalid-state") {
      return new Response("저장된 공동 편집 상태가 올바르지 않습니다.", {
        status: 500,
      })
    }

    const upgraded = upgrade(request, {
      actorId: authorization.actorId,
      channel: "collaboration",
      initialSnapshot: prepared.value.snapshot,
      initialStateVersion: prepared.value.stateVersion,
      roomId: resourceDocumentId,
    })

    return upgraded
      ? undefined
      : new Response("WebSocket upgrade에 실패했습니다.", { status: 500 })
  }
}

function readResourceDocumentId(requestUrl: string) {
  const pathname = new URL(requestUrl).pathname
  const match = /^\/resources\/collaboration\/([^/]+)$/.exec(pathname)

  if (match === null) return null

  const encodedId = match[1]

  if (encodedId === undefined) return null

  try {
    const decodedId = decodeURIComponent(encodedId)

    return decodedId === "" || decodedId.includes("/")
      ? null
      : toResourceDocumentId(decodedId)
  } catch {
    return null
  }
}
