import { parseAdminResourceRealtimeMessage } from "@/lib/api/http-admin-api"
import type {
  AdminResourceDocumentRealtimeEvent,
  AdminResourceEvent,
} from "@/lib/api/admin-api"

export type ResourceEventsSubscription = {
  readonly disconnect: () => void
  readonly subscribeDocument: (input: {
    readonly documentId: string
    readonly knownStateVersion: number
  }) => void
  readonly unsubscribeDocument: (documentId: string) => void
}

export type ConnectResourceEventsInput = {
  readonly onConnectionChange: (connected: boolean) => void
  readonly onDocumentEvent?: (event: AdminResourceDocumentRealtimeEvent) => void
  readonly onError: () => void
  readonly onEvent: (event: AdminResourceEvent) => void
  readonly serverUrl: string
}

export type ResourceEventsConnector = (
  input: ConnectResourceEventsInput
) => ResourceEventsSubscription

export type ResourceEventRevisionGap = {
  readonly currentRevision: number | null
  readonly incomingRevision: number
}

export type ResourceEventRevisionGapRecorder = (
  gap: ResourceEventRevisionGap
) => void

const initialReconnectDelayMilliseconds = 250
const maximumReconnectDelayMilliseconds = 2_500
const resourceHeartbeatIntervalMilliseconds = 15_000

export function classifyResourceEventRevision(
  currentRevision: number | null,
  incomingRevision: number
): "gap" | "next" | "stale" {
  if (currentRevision === null || incomingRevision > currentRevision + 1) {
    return "gap"
  }

  return incomingRevision <= currentRevision ? "stale" : "next"
}

export const recordBrowserResourceEventRevisionGap: ResourceEventRevisionGapRecorder =
  (gap) => {
    performance.mark("resource-tree.revision-gap", { detail: gap })
  }

export const connectBrowserResourceEvents: ResourceEventsConnector = (
  input
) => {
  let reconnectAttempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let socket: WebSocket | null = null
  let activeDocument: {
    readonly documentId: string
    readonly knownStateVersion: number
  } | null = null
  let connected = false
  let stopped = false

  function send(message: object): void {
    if (!connected || socket === null) return
    socket.send(JSON.stringify(message))
  }

  function sendActiveDocumentSubscription(): void {
    if (activeDocument === null) return
    send({
      ...activeDocument,
      type: "resource-document-subscribe",
    })
  }

  function stopHeartbeat(): void {
    if (heartbeatTimer !== null) clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }

  function startHeartbeat(): void {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
      send({
        sentAt: new Date().toISOString(),
        type: "resource-realtime-heartbeat",
      })
    }, resourceHeartbeatIntervalMilliseconds)
  }

  function connect(): void {
    if (stopped) return

    input.onConnectionChange(false)
    const nextSocket = new WebSocket(input.serverUrl)

    socket = nextSocket
    nextSocket.addEventListener("close", onClose)
    nextSocket.addEventListener("message", onMessage)
    nextSocket.addEventListener("open", onOpen)
  }

  function onClose(): void {
    connected = false
    stopHeartbeat()
    socket = null
    input.onConnectionChange(false)
    if (stopped || reconnectTimer !== null) return

    const reconnectDelay = Math.min(
      initialReconnectDelayMilliseconds * 2 ** reconnectAttempt,
      maximumReconnectDelayMilliseconds
    )

    reconnectAttempt += 1
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, reconnectDelay)
  }

  function onMessage(event: MessageEvent<unknown>): void {
    if (typeof event.data !== "string") {
      input.onError()
      return
    }

    try {
      const parsedJson: unknown = JSON.parse(event.data)
      const parsedMessage = parseAdminResourceRealtimeMessage(parsedJson)

      if (parsedMessage === null) {
        input.onError()
        return
      }

      if (
        parsedMessage.type === "resource-document-subscription-confirmed" ||
        parsedMessage.type === "resource-document-version-advanced" ||
        parsedMessage.type === "resource-document-invalidated"
      ) {
        input.onDocumentEvent?.(parsedMessage)
        return
      }

      input.onEvent(parsedMessage)
    } catch {
      input.onError()
    }
  }

  function onOpen(): void {
    reconnectAttempt = 0
    connected = true
    input.onConnectionChange(true)
    sendActiveDocumentSubscription()
    startHeartbeat()
  }

  connect()

  return {
    disconnect() {
      if (stopped) return

      stopped = true
      connected = false
      stopHeartbeat()
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      reconnectTimer = null

      const currentSocket = socket

      socket = null
      currentSocket?.removeEventListener("close", onClose)
      currentSocket?.removeEventListener("message", onMessage)
      currentSocket?.removeEventListener("open", onOpen)
      currentSocket?.close(1000, "자료실 이벤트 구독을 종료합니다.")
    },
    subscribeDocument(nextDocument) {
      const previousDocument = activeDocument
      activeDocument = nextDocument

      if (
        previousDocument !== null &&
        previousDocument.documentId !== nextDocument.documentId
      ) {
        send({
          documentId: previousDocument.documentId,
          type: "resource-document-unsubscribe",
        })
      }
      sendActiveDocumentSubscription()
    },
    unsubscribeDocument(documentId) {
      if (activeDocument?.documentId !== documentId) return

      activeDocument = null
      send({ documentId, type: "resource-document-unsubscribe" })
    },
  }
}
