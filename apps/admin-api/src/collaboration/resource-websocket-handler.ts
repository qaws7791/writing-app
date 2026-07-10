import type {
  ResourceEventsConnectionData,
  ResourceEventsHub,
} from "@/collaboration/resource-events-hub"
import type {
  YWebSocketBunAdapter,
  YWebSocketConnectionData,
} from "@/collaboration/y-websocket-bun-adapter"

export type ResourceWebSocketConnectionData =
  | ResourceEventsConnectionData
  | YWebSocketConnectionData

type ResourceWebSocket = Bun.ServerWebSocket<ResourceWebSocketConnectionData>

export function createResourceWebSocketHandler(input: {
  readonly collaboration: YWebSocketBunAdapter
  readonly events: ResourceEventsHub
}): Bun.WebSocketHandler<ResourceWebSocketConnectionData> {
  return {
    close(socket, code, reason) {
      if (isCollaborationSocket(socket)) {
        input.collaboration.websocket.close?.(socket, code, reason)
      } else if (isEventsSocket(socket)) {
        input.events.websocket.close?.(socket, code, reason)
      }
    },
    message(socket, message) {
      if (isCollaborationSocket(socket)) {
        input.collaboration.websocket.message(socket, message)
      } else if (isEventsSocket(socket)) {
        input.events.websocket.message(socket, message)
      }
    },
    open(socket) {
      if (isCollaborationSocket(socket)) {
        input.collaboration.websocket.open?.(socket)
      } else if (isEventsSocket(socket)) {
        input.events.websocket.open?.(socket)
      }
    },
  }
}

function isCollaborationSocket(
  socket: ResourceWebSocket
): socket is Bun.ServerWebSocket<YWebSocketConnectionData> {
  return socket.data.channel === "collaboration"
}

function isEventsSocket(
  socket: ResourceWebSocket
): socket is Bun.ServerWebSocket<ResourceEventsConnectionData> {
  return socket.data.channel === "events"
}
