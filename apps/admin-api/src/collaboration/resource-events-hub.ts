import {
  adminResourceEventSchema,
  adminResourceRealtimeClientMessageSchema,
  adminResourceRealtimeServerMessageSchema,
  type AdminResourceEvent,
  type AdminResourceRealtimeServerMessage,
} from "@workspace/contracts/admin"

import {
  adminSessionExpiresAt,
  type AdminSessionResolver,
} from "@/auth/admin-session"

export const resourceEventsMaxPayloadBytes = 4 * 1024
export const resourceEventsBackpressureLimitBytes = 64 * 1024
export const resourceEventsMaxConnectionsPerActor = 5
export const resourceEventsMaxConnectionsPerIp = 20
export const resourceEventsMaxMessagesPerWindow = 60
export const resourceEventsMaxSubscriptionsPerWindow = 20
export const resourceEventsRateWindowMilliseconds = 10_000
const maximumTimerDelayMilliseconds = 2_147_000_000

export type ResourceEventsConnectionData = {
  readonly actorId: string
  readonly channel: "events"
  readonly clientIp: string
  readonly sessionExpiresAtMilliseconds: number
  readonly sessionHeaders: Headers
}

export type ResourceEventsPolicyViolationReason =
  | "actor-connection-quota"
  | "ip-connection-quota"
  | "message-rate-quota"
  | "session-expired"
  | "session-revoked"
  | "subscribe-rate-quota"

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
type RateWindow = { readonly count: number; readonly startedAt: number }

export function createResourceEventsHub(input: {
  readonly heartbeatTimeoutMilliseconds?: number
  readonly limits?: {
    readonly maxConnectionsPerActor?: number
    readonly maxConnectionsPerIp?: number
    readonly maxMessagesPerWindow?: number
    readonly maxSubscriptionsPerWindow?: number
    readonly rateWindowMilliseconds?: number
  }
  readonly now?: () => number
  readonly onPolicyViolation?: (event: {
    readonly actorId: string
    readonly reason: ResourceEventsPolicyViolationReason
  }) => void
  readonly readDocumentStateVersion: (
    documentId: string
  ) => Promise<number | null>
  readonly sessionResolver: AdminSessionResolver
}): ResourceEventsHub {
  const sockets = new Set<ResourceEventsSocket>()
  const heartbeatTimers = new Map<
    ResourceEventsSocket,
    ReturnType<typeof setTimeout>
  >()
  const sessionExpirationTimers = new Map<
    ResourceEventsSocket,
    ReturnType<typeof setTimeout>
  >()
  const socketSubscriptions = new Map<ResourceEventsSocket, string>()
  const socketMessageOperations = new Map<ResourceEventsSocket, Promise<void>>()
  const subscribersByDocument = new Map<string, Set<ResourceEventsSocket>>()
  const messageRatesByActor = new Map<string, RateWindow>()
  const subscriptionRatesByActor = new Map<string, RateWindow>()
  const heartbeatTimeoutMilliseconds =
    input.heartbeatTimeoutMilliseconds ?? 45_000
  const now = input.now ?? (() => Date.now())
  const limits = {
    maxConnectionsPerActor:
      input.limits?.maxConnectionsPerActor ??
      resourceEventsMaxConnectionsPerActor,
    maxConnectionsPerIp:
      input.limits?.maxConnectionsPerIp ?? resourceEventsMaxConnectionsPerIp,
    maxMessagesPerWindow:
      input.limits?.maxMessagesPerWindow ?? resourceEventsMaxMessagesPerWindow,
    maxSubscriptionsPerWindow:
      input.limits?.maxSubscriptionsPerWindow ??
      resourceEventsMaxSubscriptionsPerWindow,
    rateWindowMilliseconds:
      input.limits?.rateWindowMilliseconds ??
      resourceEventsRateWindowMilliseconds,
  }

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
    clearSocketTimer(heartbeatTimers, socket)
    clearSocketTimer(sessionExpirationTimers, socket)
    socketMessageOperations.delete(socket)
    removeSubscription(socket)
  }

  function scheduleHeartbeatTimeout(socket: ResourceEventsSocket): void {
    clearSocketTimer(heartbeatTimers, socket)
    heartbeatTimers.set(
      socket,
      setTimeout(() => {
        removeSocket(socket)
        closeSocket(socket, 1001, "자료실 실시간 heartbeat가 만료되었습니다.")
      }, heartbeatTimeoutMilliseconds)
    )
  }

  function scheduleSessionExpiration(socket: ResourceEventsSocket): void {
    clearSocketTimer(sessionExpirationTimers, socket)
    const delay = Math.max(0, socket.data.sessionExpiresAtMilliseconds - now())
    sessionExpirationTimers.set(
      socket,
      setTimeout(
        () => {
          if (socket.data.sessionExpiresAtMilliseconds <= now()) {
            rejectSocket(
              socket,
              "session-expired",
              "관리자 세션이 만료되었습니다."
            )
            return
          }
          scheduleSessionExpiration(socket)
        },
        Math.min(delay, maximumTimerDelayMilliseconds)
      )
    )
  }

  function rejectSocket(
    socket: ResourceEventsSocket,
    reason: ResourceEventsPolicyViolationReason,
    message: string
  ): void {
    input.onPolicyViolation?.({ actorId: socket.data.actorId, reason })
    removeSocket(socket)
    closeSocket(socket, 1008, message)
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

  async function hasActiveSession(
    socket: ResourceEventsSocket
  ): Promise<boolean> {
    if (socket.data.sessionExpiresAtMilliseconds <= now()) {
      rejectSocket(socket, "session-expired", "관리자 세션이 만료되었습니다.")
      return false
    }

    const session = await input.sessionResolver.resolveSession(
      socket.data.sessionHeaders
    )
    if (
      session === null ||
      session.admin.id !== socket.data.actorId ||
      session[adminSessionExpiresAt].getTime() <= now()
    ) {
      rejectSocket(socket, "session-revoked", "관리자 세션이 폐기되었습니다.")
      return false
    }

    return true
  }

  async function handleClientMessage(
    socket: ResourceEventsSocket,
    message: string | Buffer<ArrayBufferLike>
  ): Promise<void> {
    if (!sockets.has(socket)) return
    if (
      !consumeRate(
        messageRatesByActor,
        socket.data.actorId,
        limits.maxMessagesPerWindow,
        limits.rateWindowMilliseconds,
        now()
      )
    ) {
      rejectSocket(
        socket,
        "message-rate-quota",
        "메시지 전송 한도를 초과했습니다."
      )
      return
    }

    const parsed = parseClientMessage(message)
    if (parsed === null) {
      removeSocket(socket)
      closeSocket(socket, 1008, "자료실 실시간 메시지가 올바르지 않습니다.")
      return
    }
    if (!(await hasActiveSession(socket)) || !sockets.has(socket)) return

    scheduleHeartbeatTimeout(socket)
    if (parsed.type === "resource-realtime-heartbeat") return

    if (parsed.type === "resource-document-unsubscribe") {
      if (socketSubscriptions.get(socket) === parsed.documentId) {
        removeSubscription(socket)
      }
      return
    }

    if (
      !consumeRate(
        subscriptionRatesByActor,
        socket.data.actorId,
        limits.maxSubscriptionsPerWindow,
        limits.rateWindowMilliseconds,
        now()
      )
    ) {
      rejectSocket(
        socket,
        "subscribe-rate-quota",
        "구독 전환 한도를 초과했습니다."
      )
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

    sendMessage(
      socket,
      adminResourceRealtimeServerMessageSchema.parse({
        documentId: parsed.documentId,
        stateVersion,
        type: "resource-document-subscription-confirmed",
      })
    )
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
      backpressureLimit: resourceEventsBackpressureLimitBytes,
      close(socket) {
        removeSocket(socket)
      },
      closeOnBackpressureLimit: true,
      maxPayloadLength: resourceEventsMaxPayloadBytes,
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
        const actorConnections = countSockets(
          sockets,
          (current) => current.data.actorId === socket.data.actorId
        )
        if (actorConnections >= limits.maxConnectionsPerActor) {
          rejectSocket(
            socket,
            "actor-connection-quota",
            "관리자 연결 한도를 초과했습니다."
          )
          return
        }

        const ipConnections = countSockets(
          sockets,
          (current) => current.data.clientIp === socket.data.clientIp
        )
        if (ipConnections >= limits.maxConnectionsPerIp) {
          rejectSocket(
            socket,
            "ip-connection-quota",
            "IP 연결 한도를 초과했습니다."
          )
          return
        }

        sockets.add(socket)
        scheduleHeartbeatTimeout(socket)
        scheduleSessionExpiration(socket)
      },
    },
  }
}

function countSockets(
  sockets: ReadonlySet<ResourceEventsSocket>,
  predicate: (socket: ResourceEventsSocket) => boolean
): number {
  let count = 0
  for (const socket of sockets) {
    if (predicate(socket)) count += 1
  }
  return count
}

function consumeRate(
  windows: Map<string, RateWindow>,
  key: string,
  limit: number,
  windowMilliseconds: number,
  currentTime: number
): boolean {
  for (const [candidateKey, candidate] of windows) {
    if (
      candidateKey !== key &&
      currentTime - candidate.startedAt >= windowMilliseconds
    ) {
      windows.delete(candidateKey)
    }
  }

  const current = windows.get(key)
  const window =
    current === undefined ||
    currentTime - current.startedAt >= windowMilliseconds
      ? { count: 1, startedAt: currentTime }
      : { count: current.count + 1, startedAt: current.startedAt }
  windows.set(key, window)
  return window.count <= limit
}

function clearSocketTimer(
  timers: Map<ResourceEventsSocket, ReturnType<typeof setTimeout>>,
  socket: ResourceEventsSocket
): void {
  const timer = timers.get(socket)
  if (timer !== undefined) clearTimeout(timer)
  timers.delete(socket)
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
