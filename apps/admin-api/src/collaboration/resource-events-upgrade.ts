import type { AdminSessionResolver } from "@/auth/admin-session"
import type { ResourceEventsConnectionData } from "@/collaboration/resource-events-hub"
import {
  authorizeResourceWebSocket,
  type ResourceWebSocketAuthorizationRejectionReason,
} from "@/collaboration/resource-websocket-authorization"

export type ResourceEventsUpgrade = (
  request: Request,
  data: ResourceEventsConnectionData
) => boolean

export function createResourceEventsUpgradeHandler(input: {
  readonly adminOrigin: string
  readonly onAuthorizationRejected: (
    reason: ResourceWebSocketAuthorizationRejectionReason
  ) => void
  readonly sessionResolver: AdminSessionResolver
}) {
  return async (
    request: Request,
    upgrade: ResourceEventsUpgrade
  ): Promise<Response | null | undefined> => {
    if (new URL(request.url).pathname !== "/resources/events") return null

    const authorization = await authorizeResourceWebSocket({
      ...input,
      request,
    })

    if (authorization.kind === "error") {
      input.onAuthorizationRejected(authorization.reason)
      return authorization.response
    }

    return upgrade(request, {
      actorId: authorization.actorId,
      channel: "events",
    })
      ? undefined
      : new Response("WebSocket upgrade에 실패했습니다.", { status: 500 })
  }
}
