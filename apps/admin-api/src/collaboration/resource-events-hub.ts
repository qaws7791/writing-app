import {
  adminResourceEventSchema,
  adminResourceRealtimeClientMessageSchema,
  adminResourceRealtimeServerMessageSchema,
  type AdminResourceEvent,
  type AdminResourceRealtimeServerMessage,
} from "@workspace/contracts/admin"

export type ResourceEventsConnectionData = {
  readonly actorId: string
  readonly channel: "events"
}

export type ResourceEventsHub = {
  readonly countActiveEditors: (documentIds: readonly string[]) => number
  readonly publish: (event: AdminResourceEvent) => void
  readonly publishDocumentInvalidated: (
    event: Extract<
      AdminResourceRealtimeServerMessage,
      { readonly type: "resource-document-invalidated" }
    >
  ) => void
  readonly publishDocumentVersion: (
    event: Extract<
      AdminResourceRealtimeServerMessage,
      { readonly type: "resource-document-version-advanced" }
    >
  ) => void
  readonly websocket: Bun.WebSocketHandler<ResourceEventsConnectionData>
}

export type ResourceEventsPublisher = Pick<ResourceEventsHub, "publish">
export type ResourceEventsWorkspace = Pick<
  ResourceEventsHub,
  | "countActiveEditors"
  | "publish"
  | "publishDocumentInvalidated"
  | "publishDocumentVersion"
>

type ResourceEventsSocket = Bun.ServerWebSocket<ResourceEventsConnectionData>

export function createResourceEventsHub(input: {
  readonly heartbeatTimeoutMilliseconds?: number
  readonly readDocumentStateVersion: (
    documentId: string
  ) => Promise<number | null>
}): ResourceEventsHub {
  const sockets = new Set<ResourceEventsSocket>()
  const heartbeatTimers = new Map<
    ResourceEventsSocket,
    ReturnType<typeof setTimeout>
  >()
  const socketSubscriptions = new Map<ResourceEventsSocket, string>()
  const socketMessageOperations = new Map<ResourceEventsSocket, Promise<void>>()
  const subscribersByDocument = new Map<string, Set<ResourceEventsSocket>>()
  const heartbeatTimeoutMilliseconds =
    input.heartbeatTimeoutMilliseconds ?? 45_000

  function removeSubscription(socket: ResourceEventsSocket): void {
    const documentId = socketSubscriptions.get(socket)
    if (documentId === undefined) return

    socketSubscriptions.delete(socket)
    const subscribers = subscribersByDocument.get(documentId)
    subscribers?.delete(socket)
    if (subscribers?.size === 0) subscribersByDocument.delete(documentId)
  }

  function removeSocket(socket: ResourceEventsSocket): void {
    sockets.delete(socket)
    const heartbeatTimer = heartbeatTimers.get(socket)
    if (heartbeatTimer !== undefined) clearTimeout(heartbeatTimer)
    heartbeatTimers.delete(socket)
    socketMessageOperations.delete(socket)
    removeSubscription(socket)
  }

  function scheduleHeartbeatTimeout(socket: ResourceEventsSocket): void {
    const currentTimer = heartbeatTimers.get(socket)
    if (currentTimer !== undefined) clearTimeout(currentTimer)

    heartbeatTimers.set(
      socket,
      setTimeout(() => {
        removeSocket(socket)
        closeSocket(socket, 1001, "자료실 실시간 heartbeat가 만료되었습니다.")
      }, heartbeatTimeoutMilliseconds)
    )
  }

  function sendMessage(
    socket: ResourceEventsSocket,
    message: AdminResourceRealtimeServerMessage
  ): boolean {
    try {
      if (socket.send(JSON.stringify(message)) !== 0) return true
    } catch {
      // 실패한 연결은 아래 공통 정리 경로에서 격리한다.
    }

    removeSocket(socket)
    closeSocket(socket, 1011, "자료실 실시간 메시지 전송에 실패했습니다.")
    return false
  }

  function publishDocumentMessage(
    event: Extract<
      AdminResourceRealtimeServerMessage,
      {
        readonly type:
          | "resource-document-invalidated"
          | "resource-document-version-advanced"
      }
    >
  ): void {
    const message = adminResourceRealtimeServerMessageSchema.parse(event)
    const subscribers = subscribersByDocument.get(event.documentId)

    for (const socket of [...(subscribers ?? [])]) {
      sendMessage(socket, message)
    }
  }

  async function handleClientMessage(
    socket: ResourceEventsSocket,
    message: string | Buffer<ArrayBufferLike>
  ): Promise<void> {
    if (!sockets.has(socket)) return

    const parsed = parseClientMessage(message)

    if (parsed === null) {
      removeSocket(socket)
      closeSocket(socket, 1008, "자료실 실시간 메시지가 올바르지 않습니다.")
      return
    }

    scheduleHeartbeatTimeout(socket)

    if (parsed.type === "resource-realtime-heartbeat") return

    if (parsed.type === "resource-document-unsubscribe") {
      if (socketSubscriptions.get(socket) === parsed.documentId) {
        removeSubscription(socket)
      }
      return
    }

    const stateVersion = await input.readDocumentStateVersion(parsed.documentId)

    if (!sockets.has(socket)) return
    if (stateVersion === null) {
      removeSocket(socket)
      closeSocket(socket, 1008, "활성 문서를 찾을 수 없습니다.")
      return
    }

    removeSubscription(socket)
    socketSubscriptions.set(socket, parsed.documentId)
    const subscribers =
      subscribersByDocument.get(parsed.documentId) ?? new Set()
    subscribers.add(socket)
    subscribersByDocument.set(parsed.documentId, subscribers)

    const confirmation = adminResourceRealtimeServerMessageSchema.parse({
      documentId: parsed.documentId,
      stateVersion,
      type: "resource-document-subscription-confirmed",
    })

    sendMessage(socket, confirmation)
  }

  return {
    countActiveEditors(documentIds) {
      const actorIds = new Set<string>()

      for (const documentId of documentIds) {
        for (const socket of subscribersByDocument.get(documentId) ?? []) {
          actorIds.add(socket.data.actorId)
        }
      }

      return actorIds.size
    },
    publish(event) {
      const message = JSON.stringify(adminResourceEventSchema.parse(event))

      for (const socket of [...sockets]) {
        try {
          if (socket.send(message) !== 0) continue
        } catch {
          // 실패한 연결은 아래 공통 정리 경로에서 격리한다.
        }

        removeSocket(socket)
        closeSocket(socket, 1011, "자료실 이벤트 전송에 실패했습니다.")
      }
    },
    publishDocumentInvalidated(event) {
      publishDocumentMessage(event)
    },
    publishDocumentVersion(event) {
      publishDocumentMessage(event)
    },
    websocket: {
      close(socket) {
        removeSocket(socket)
      },
      message(socket, message) {
        const previous =
          socketMessageOperations.get(socket) ?? Promise.resolve()
        const next = previous
          .then(() => handleClientMessage(socket, message))
          .catch(() => {
            removeSocket(socket)
            closeSocket(socket, 1011, "자료실 구독 처리에 실패했습니다.")
          })

        socketMessageOperations.set(socket, next)
        void next.finally(() => {
          if (socketMessageOperations.get(socket) === next) {
            socketMessageOperations.delete(socket)
          }
        })
      },
      open(socket) {
        sockets.add(socket)
        scheduleHeartbeatTimeout(socket)
      },
    },
  }
}

function parseClientMessage(message: string | Buffer<ArrayBufferLike>) {
  if (typeof message !== "string") return null

  try {
    const parsedJson: unknown = JSON.parse(message)
    const parsed =
      adminResourceRealtimeClientMessageSchema.safeParse(parsedJson)

    return parsed.success ? parsed.data : null
  } catch {
    return null
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
