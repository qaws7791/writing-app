import { parseAdminResourceEvent } from "@/lib/api/http-admin-api"
import type { AdminResourceEvent } from "@/lib/api/admin-api"

export type ResourceEventsSubscription = {
  readonly disconnect: () => void
}

export type ConnectResourceEventsInput = {
  readonly onError: () => void
  readonly onEvent: (event: AdminResourceEvent) => void
  readonly serverUrl: string
}

export type ResourceEventsConnector = (
  input: ConnectResourceEventsInput
) => ResourceEventsSubscription

const initialReconnectDelayMilliseconds = 250
const maximumReconnectDelayMilliseconds = 2_500

export function classifyResourceEventRevision(
  currentRevision: number | null,
  incomingRevision: number
): "gap" | "next" | "stale" {
  if (currentRevision === null || incomingRevision > currentRevision + 1) {
    return "gap"
  }

  return incomingRevision <= currentRevision ? "stale" : "next"
}

export const connectBrowserResourceEvents: ResourceEventsConnector = (
  input
) => {
  let reconnectAttempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let socket: WebSocket | null = null
  let stopped = false

  function connect(): void {
    if (stopped) return

    const nextSocket = new WebSocket(input.serverUrl)

    socket = nextSocket
    nextSocket.addEventListener("close", onClose)
    nextSocket.addEventListener("message", onMessage)
    nextSocket.addEventListener("open", onOpen)
  }

  function onClose(): void {
    socket = null
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
      const parsedEvent = parseAdminResourceEvent(parsedJson)

      if (parsedEvent === null) {
        input.onError()
        return
      }

      input.onEvent(parsedEvent)
    } catch {
      input.onError()
    }
  }

  function onOpen(): void {
    reconnectAttempt = 0
  }

  connect()

  return {
    disconnect() {
      if (stopped) return

      stopped = true
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      reconnectTimer = null

      const currentSocket = socket

      socket = null
      currentSocket?.removeEventListener("close", onClose)
      currentSocket?.removeEventListener("message", onMessage)
      currentSocket?.removeEventListener("open", onOpen)
      currentSocket?.close(1000, "자료실 이벤트 구독을 종료합니다.")
    },
  }
}
