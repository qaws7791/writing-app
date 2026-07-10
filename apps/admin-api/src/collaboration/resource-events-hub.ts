import {
  adminResourceEventSchema,
  type AdminResourceEvent,
} from "@workspace/contracts/admin"

export type ResourceEventsConnectionData = {
  readonly actorId: string
  readonly channel: "events"
}

export type ResourceEventsHub = {
  readonly publish: (event: AdminResourceEvent) => void
  readonly websocket: Bun.WebSocketHandler<ResourceEventsConnectionData>
}

export type ResourceEventsPublisher = Pick<ResourceEventsHub, "publish">

type ResourceEventsSocket = Bun.ServerWebSocket<ResourceEventsConnectionData>

export function createResourceEventsHub(): ResourceEventsHub {
  const sockets = new Set<ResourceEventsSocket>()

  return {
    publish(event) {
      const message = JSON.stringify(adminResourceEventSchema.parse(event))

      for (const socket of [...sockets]) {
        try {
          if (socket.send(message) !== 0) continue
        } catch {
          // 실패한 연결은 아래 공통 정리 경로에서 격리한다.
        }

        sockets.delete(socket)
        closeSocket(socket, 1011, "자료실 이벤트 전송에 실패했습니다.")
      }
    },
    websocket: {
      close(socket) {
        sockets.delete(socket)
      },
      message(socket) {
        sockets.delete(socket)
        closeSocket(socket, 1008, "자료실 이벤트 채널은 수신 전용입니다.")
      },
      open(socket) {
        sockets.add(socket)
      },
    },
  }
}

function closeSocket(
  socket: ResourceEventsSocket,
  code: number,
  reason: string
): void {
  try {
    socket.close(code, reason)
  } catch {
    // 구독 정리는 이미 완료되었으므로 transport close 실패를 전파하지 않는다.
  }
}
