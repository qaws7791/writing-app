import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createResourceEventsHub,
  resourceEventsBackpressureLimitBytes,
  resourceEventsMaxPayloadBytes,
  type ResourceEventsConnectionData,
} from "@/collaboration/resource-events-hub"
import { testAdminSession } from "@/routes/test-dependencies"

type TestSocket = Parameters<
  NonNullable<ReturnType<typeof createResourceEventsHub>["websocket"]["open"]>
>[0]

describe("자료실 이벤트 WebSocket 자원 정책", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-12T00:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("세션 만료 시각에 연결을 1008로 닫는다", async () => {
    const hub = createHub()
    const socket = createSocket({
      sessionExpiresAtMilliseconds: Date.now() + 1_000,
    })

    hub.websocket.open?.(socket)
    await vi.advanceTimersByTimeAsync(1_000)

    expect(socket.close).toHaveBeenCalledWith(
      1008,
      "관리자 세션이 만료되었습니다."
    )
  })

  it("heartbeat에서 폐기된 세션을 다시 확인하고 1008로 닫는다", async () => {
    let sessionActive = true
    const hub = createHub({ sessionActive: () => sessionActive })
    const socket = createSocket()
    hub.websocket.open?.(socket)
    sessionActive = false

    hub.websocket.message?.(
      socket,
      JSON.stringify({
        sentAt: "2026-07-12T00:00:00.000Z",
        type: "resource-realtime-heartbeat",
      })
    )
    await settleMessages()

    expect(socket.close).toHaveBeenCalledWith(
      1008,
      "관리자 세션이 폐기되었습니다."
    )
  })

  it("actor와 IP의 N+1 연결을 1008로 거부한다", () => {
    const actorHub = createHub({ maxConnectionsPerActor: 1 })
    const firstActorSocket = createSocket()
    const secondActorSocket = createSocket({ clientIp: "198.51.100.2" })
    actorHub.websocket.open?.(firstActorSocket)
    actorHub.websocket.open?.(secondActorSocket)

    expect(secondActorSocket.close).toHaveBeenCalledWith(
      1008,
      "관리자 연결 한도를 초과했습니다."
    )

    const ipHub = createHub({ maxConnectionsPerIp: 1 })
    const firstIpSocket = createSocket()
    const secondIpSocket = createSocket({ actorId: "admin-2" })
    ipHub.websocket.open?.(firstIpSocket)
    ipHub.websocket.open?.(secondIpSocket)

    expect(secondIpSocket.close).toHaveBeenCalledWith(
      1008,
      "IP 연결 한도를 초과했습니다."
    )
  })

  it("actor별 message와 subscribe burst를 1008로 제한한다", async () => {
    const heartbeat = JSON.stringify({
      sentAt: "2026-07-12T00:00:00.000Z",
      type: "resource-realtime-heartbeat",
    })
    const messageHub = createHub({ maxMessagesPerWindow: 1 })
    const messageSocket = createSocket()
    messageHub.websocket.open?.(messageSocket)
    messageHub.websocket.message?.(messageSocket, heartbeat)
    messageHub.websocket.message?.(messageSocket, heartbeat)
    await settleMessages()

    expect(messageSocket.close).toHaveBeenCalledWith(
      1008,
      "메시지 전송 한도를 초과했습니다."
    )

    const subscribeHub = createHub({ maxSubscriptionsPerWindow: 1 })
    const subscribeSocket = createSocket()
    subscribeHub.websocket.open?.(subscribeSocket)
    subscribeHub.websocket.message?.(
      subscribeSocket,
      subscribeMessage("document-1")
    )
    subscribeHub.websocket.message?.(
      subscribeSocket,
      subscribeMessage("document-2")
    )
    await settleMessages()

    expect(subscribeSocket.close).toHaveBeenCalledWith(
      1008,
      "구독 전환 한도를 초과했습니다."
    )
  })

  it("Bun handler가 payload와 backpressure를 앱 handler 전에 제한한다", () => {
    const websocket = createHub().websocket

    expect(websocket.maxPayloadLength).toBe(resourceEventsMaxPayloadBytes)
    expect(websocket.backpressureLimit).toBe(
      resourceEventsBackpressureLimitBytes
    )
    expect(websocket.closeOnBackpressureLimit).toBe(true)
  })

  it("oversized payload를 실제 Bun transport에서 앱 message handler 전에 닫는다", async () => {
    vi.useRealTimers()
    const hub = createHub()
    const message = vi.fn(hub.websocket.message)
    const server = Bun.serve<ResourceEventsConnectionData>({
      fetch(request, bunServer) {
        return bunServer.upgrade(request, { data: createSocketData() })
          ? undefined
          : new Response("upgrade failed", { status: 500 })
      },
      port: 0,
      websocket: { ...hub.websocket, message },
    })
    const client = new WebSocket(`ws://127.0.0.1:${server.port}`)

    try {
      await new Promise<void>((resolve, reject) => {
        client.addEventListener("open", () => resolve(), { once: true })
        client.addEventListener(
          "error",
          () => reject(new Error("open failed")),
          {
            once: true,
          }
        )
      })
      const closed = new Promise<CloseEvent>((resolve) => {
        client.addEventListener("close", (event) => resolve(event), {
          once: true,
        })
      })
      client.send("x".repeat(resourceEventsMaxPayloadBytes + 1))

      const closeEvent = await closed
      expect([1006, 1009]).toContain(closeEvent.code)
      expect(message).not.toHaveBeenCalled()
    } finally {
      client.close()
      server.stop(true)
    }
  })
})

function createHub(
  input: {
    readonly maxConnectionsPerActor?: number
    readonly maxConnectionsPerIp?: number
    readonly maxMessagesPerWindow?: number
    readonly maxSubscriptionsPerWindow?: number
    readonly sessionActive?: () => boolean
  } = {}
) {
  return createResourceEventsHub({
    limits: input,
    async readDocumentStateVersion() {
      return 1
    },
    sessionResolver: {
      async resolveSession() {
        return (input.sessionActive?.() ?? true) ? testAdminSession : null
      },
    },
  })
}

function createSocket(data: Partial<ResourceEventsConnectionData> = {}) {
  const socket = {
    binaryType: "nodebuffer" as const,
    close: vi.fn(),
    cork<TResult>(callback: (websocket: TestSocket) => TResult): TResult {
      return callback(socket)
    },
    data: {
      actorId: "admin-1",
      channel: "events",
      clientIp: "198.51.100.1",
      sessionExpiresAtMilliseconds: Date.now() + 60_000,
      sessionHeaders: new Headers({ cookie: "admin_session_token=token" }),
      ...data,
    },
    getBufferedAmount: vi.fn(() => 0),
    isSubscribed: vi.fn(() => false),
    ping: vi.fn(() => 1),
    pong: vi.fn(() => 1),
    publish: vi.fn(() => 1),
    publishBinary: vi.fn(() => 1),
    publishText: vi.fn(() => 1),
    readyState: 1 as const,
    remoteAddress: "198.51.100.1",
    send: vi.fn(() => 1),
    sendBinary: vi.fn(() => 1),
    sendText: vi.fn(() => 1),
    subscribe: vi.fn(),
    subscriptions: [],
    terminate: vi.fn(),
    unsubscribe: vi.fn(),
  } satisfies TestSocket

  return socket
}

function createSocketData(): ResourceEventsConnectionData {
  return {
    actorId: "admin-1",
    channel: "events",
    clientIp: "198.51.100.1",
    sessionExpiresAtMilliseconds: Date.now() + 60_000,
    sessionHeaders: new Headers({ cookie: "admin_session_token=token" }),
  }
}

function subscribeMessage(documentId: string): string {
  return JSON.stringify({
    documentId,
    knownStateVersion: 0,
    type: "resource-document-subscribe",
  })
}

async function settleMessages(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0)
  await Promise.resolve()
  await Promise.resolve()
}
