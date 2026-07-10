import { describe, expect, it } from "vitest"
import { WebsocketProvider } from "y-websocket"
import { Doc } from "yjs"

import { createResourceEventsHub } from "@/collaboration/resource-events-hub"
import {
  createResourceWebSocketHandler,
  type ResourceWebSocketConnectionData,
} from "@/collaboration/resource-websocket-handler"
import { createYWebSocketBunAdapter } from "@/collaboration/y-websocket-bun-adapter"
import { adminResourceRealtimeServerMessageSchema } from "@workspace/contracts/admin"

describe("자료실 통합 WebSocket handler", () => {
  it("events 연결에서 활성 문서를 구독하고 현재 version을 확인한다", async () => {
    const collaboration = createYWebSocketBunAdapter()
    const events = createResourceEventsHub({
      readDocumentStateVersion: async () => 7,
    })
    const server = Bun.serve<ResourceWebSocketConnectionData>({
      fetch(request, bunServer) {
        return bunServer.upgrade(request, {
          data: { actorId: "admin-1", channel: "events" },
        })
          ? undefined
          : new Response("WebSocket upgrade가 필요합니다.", { status: 426 })
      },
      port: 0,
      websocket: createResourceWebSocketHandler({ collaboration, events }),
    })
    const socket = new WebSocket(
      `ws://127.0.0.1:${server.port}/resources/events`
    )

    try {
      await waitForOpen(socket)
      const confirmation = waitForMessage(socket)

      socket.send(
        JSON.stringify({
          documentId: "document-1",
          knownStateVersion: 4,
          type: "resource-document-subscribe",
        })
      )

      await expect(confirmation).resolves.toEqual({
        documentId: "document-1",
        stateVersion: 7,
        type: "resource-document-subscription-confirmed",
      })
    } finally {
      socket.close()
      await collaboration.dispose()
      server.stop(true)
    }
  })

  it("본문 version 사건을 해당 문서 구독 연결에만 전달한다", async () => {
    const collaboration = createYWebSocketBunAdapter()
    const events = createResourceEventsHub({
      readDocumentStateVersion: async () => 0,
    })
    const server = Bun.serve<ResourceWebSocketConnectionData>({
      fetch(request, bunServer) {
        const actorId = new URL(request.url).pathname.slice(1)
        return bunServer.upgrade(request, {
          data: { actorId, channel: "events" },
        })
          ? undefined
          : new Response("WebSocket upgrade가 필요합니다.", { status: 426 })
      },
      port: 0,
      websocket: createResourceWebSocketHandler({ collaboration, events }),
    })
    const firstSocket = new WebSocket(`ws://127.0.0.1:${server.port}/admin-1`)
    const secondSocket = new WebSocket(`ws://127.0.0.1:${server.port}/admin-2`)

    try {
      await Promise.all([waitForOpen(firstSocket), waitForOpen(secondSocket)])
      await Promise.all([
        subscribeDocument(firstSocket, "document-1"),
        subscribeDocument(secondSocket, "document-2"),
      ])
      const firstVersionEvent = waitForMessage(firstSocket)
      const secondVersionEvent = waitForMessage(secondSocket)

      events.publishDocumentVersion({
        contentRevision: 5,
        documentId: "document-1",
        stateVersion: 3,
        type: "resource-document-version-advanced",
      })
      events.publishDocumentVersion({
        contentRevision: 8,
        documentId: "document-2",
        stateVersion: 6,
        type: "resource-document-version-advanced",
      })

      await expect(firstVersionEvent).resolves.toMatchObject({
        documentId: "document-1",
        stateVersion: 3,
      })
      await expect(secondVersionEvent).resolves.toMatchObject({
        documentId: "document-2",
        stateVersion: 6,
      })
    } finally {
      firstSocket.close()
      secondSocket.close()
      await collaboration.dispose()
      server.stop(true)
    }
  })

  it("같은 관리자의 여러 탭을 활성 편집자 한 명으로 계산한다", async () => {
    const collaboration = createYWebSocketBunAdapter()
    const events = createResourceEventsHub({
      readDocumentStateVersion: async () => 0,
    })
    const server = Bun.serve<ResourceWebSocketConnectionData>({
      fetch(request, bunServer) {
        const actorId = new URL(request.url).pathname.slice(1)
        return bunServer.upgrade(request, {
          data: { actorId, channel: "events" },
        })
          ? undefined
          : new Response("WebSocket upgrade가 필요합니다.", { status: 426 })
      },
      port: 0,
      websocket: createResourceWebSocketHandler({ collaboration, events }),
    })
    const firstTab = new WebSocket(`ws://127.0.0.1:${server.port}/admin-1`)
    const secondTab = new WebSocket(`ws://127.0.0.1:${server.port}/admin-1`)

    try {
      await Promise.all([waitForOpen(firstTab), waitForOpen(secondTab)])
      await Promise.all([
        subscribeDocument(firstTab, "document-1"),
        subscribeDocument(secondTab, "document-1"),
      ])

      expect(events.countActiveEditors(["document-1"])).toBe(1)
    } finally {
      firstTab.close()
      secondTab.close()
      await collaboration.dispose()
      server.stop(true)
    }
  })

  it("heartbeat가 만료되면 연결의 문서 구독을 정리한다", async () => {
    const collaboration = createYWebSocketBunAdapter()
    const events = createResourceEventsHub({
      heartbeatTimeoutMilliseconds: 20,
      readDocumentStateVersion: async () => 0,
    })
    const server = Bun.serve<ResourceWebSocketConnectionData>({
      fetch(request, bunServer) {
        return bunServer.upgrade(request, {
          data: { actorId: "admin-1", channel: "events" },
        })
          ? undefined
          : new Response("WebSocket upgrade가 필요합니다.", { status: 426 })
      },
      port: 0,
      websocket: createResourceWebSocketHandler({ collaboration, events }),
    })
    const socket = new WebSocket(`ws://127.0.0.1:${server.port}/events`)

    try {
      await waitForOpen(socket)
      await subscribeDocument(socket, "document-1")
      expect(events.countActiveEditors(["document-1"])).toBe(1)

      await waitForClose(socket)

      expect(events.countActiveEditors(["document-1"])).toBe(0)
    } finally {
      socket.close()
      await collaboration.dispose()
      server.stop(true)
    }
  })

  it("빠른 문서 전환에서도 마지막 구독 메시지를 활성 문서로 유지한다", async () => {
    const collaboration = createYWebSocketBunAdapter()
    const events = createResourceEventsHub({
      async readDocumentStateVersion(documentId) {
        if (documentId === "document-1") {
          await new Promise((resolve) => setTimeout(resolve, 30))
        }
        return 0
      },
    })
    const server = Bun.serve<ResourceWebSocketConnectionData>({
      fetch(request, bunServer) {
        return bunServer.upgrade(request, {
          data: { actorId: "admin-1", channel: "events" },
        })
          ? undefined
          : new Response("WebSocket upgrade가 필요합니다.", { status: 426 })
      },
      port: 0,
      websocket: createResourceWebSocketHandler({ collaboration, events }),
    })
    const socket = new WebSocket(`ws://127.0.0.1:${server.port}/events`)

    try {
      await waitForOpen(socket)
      const confirmations = waitForMessages(socket, 2)
      socket.send(
        JSON.stringify({
          documentId: "document-1",
          knownStateVersion: 0,
          type: "resource-document-subscribe",
        })
      )
      socket.send(
        JSON.stringify({
          documentId: "document-2",
          knownStateVersion: 0,
          type: "resource-document-subscribe",
        })
      )
      await confirmations

      expect(events.countActiveEditors(["document-1"])).toBe(0)
      expect(events.countActiveEditors(["document-2"])).toBe(1)
    } finally {
      socket.close()
      await collaboration.dispose()
      server.stop(true)
    }
  })

  it("Yjs binary room과 JSON events 채널을 같은 Bun server에서 분리한다", async () => {
    const collaboration = createYWebSocketBunAdapter()
    const events = createResourceEventsHub({
      readDocumentStateVersion: async () => 0,
    })
    const server = Bun.serve<ResourceWebSocketConnectionData>({
      fetch(request, bunServer) {
        const pathname = new URL(request.url).pathname
        const data: ResourceWebSocketConnectionData | null =
          pathname === "/resources/events"
            ? { actorId: "admin-1", channel: "events" }
            : pathname === "/resources/collaboration/document-1"
              ? {
                  actorId: "admin-1",
                  channel: "collaboration",
                  initialSnapshot: null,
                  initialStateVersion: 0,
                  roomId: "document-1",
                }
              : null

        return data !== null && bunServer.upgrade(request, { data })
          ? undefined
          : new Response("WebSocket upgrade가 필요합니다.", { status: 426 })
      },
      port: 0,
      websocket: createResourceWebSocketHandler({ collaboration, events }),
    })
    const eventSocket = new WebSocket(
      `ws://127.0.0.1:${server.port}/resources/events`
    )
    const document = new Doc()
    const provider = new WebsocketProvider(
      `ws://127.0.0.1:${server.port}/resources/collaboration`,
      "document-1",
      document,
      { disableBc: true, WebSocketPolyfill: WebSocket }
    )

    try {
      await Promise.all([waitForOpen(eventSocket), waitForSync(provider)])
      const receivedEvent = waitForMessage(eventSocket)

      events.publish({
        action: "rename",
        affectedParentIds: ["folder-1"],
        nodeId: "document-1",
        revision: 3,
        type: "resource-tree-mutated",
      })

      await expect(receivedEvent).resolves.toEqual({
        action: "rename",
        affectedParentIds: ["folder-1"],
        nodeId: "document-1",
        revision: 3,
        type: "resource-tree-mutated",
      })
      expect(collaboration.getRoomConnectionCount("document-1")).toBe(1)
    } finally {
      eventSocket.close()
      provider.destroy()
      document.destroy()
      await collaboration.dispose()
      server.stop(true)
    }
  })
})

function waitForOpen(socket: WebSocket): Promise<void> {
  if (socket.readyState === WebSocket.OPEN) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("자료실 이벤트 WebSocket 연결 시간이 초과되었습니다."))
    }, 5_000)

    socket.addEventListener(
      "open",
      () => {
        clearTimeout(timeout)
        resolve()
      },
      { once: true }
    )
  })
}

function waitForClose(socket: WebSocket): Promise<void> {
  if (socket.readyState === WebSocket.CLOSED) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("자료실 이벤트 WebSocket 종료 시간이 초과되었습니다."))
    }, 1_000)

    socket.addEventListener(
      "close",
      () => {
        clearTimeout(timeout)
        resolve()
      },
      { once: true }
    )
  })
}

function waitForMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("자료실 이벤트 수신 시간이 초과되었습니다."))
    }, 5_000)

    socket.addEventListener(
      "message",
      (event) => {
        clearTimeout(timeout)
        const parsedJson: unknown = JSON.parse(String(event.data))

        resolve(adminResourceRealtimeServerMessageSchema.parse(parsedJson))
      },
      { once: true }
    )
  })
}

function waitForMessages(socket: WebSocket, count: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let receivedCount = 0
    const timeout = setTimeout(() => {
      socket.removeEventListener("message", onMessage)
      reject(new Error("자료실 이벤트 수신 시간이 초과되었습니다."))
    }, 5_000)
    const onMessage = () => {
      receivedCount += 1
      if (receivedCount < count) return

      clearTimeout(timeout)
      socket.removeEventListener("message", onMessage)
      resolve()
    }

    socket.addEventListener("message", onMessage)
  })
}

async function subscribeDocument(
  socket: WebSocket,
  documentId: string
): Promise<void> {
  const confirmation = waitForMessage(socket)
  socket.send(
    JSON.stringify({
      documentId,
      knownStateVersion: 0,
      type: "resource-document-subscribe",
    })
  )
  await confirmation
}

function waitForSync(provider: WebsocketProvider): Promise<void> {
  if (provider.synced) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      provider.off("sync", onSync)
      reject(new Error("Yjs WebSocket 초기 동기화 시간이 초과되었습니다."))
    }, 5_000)
    const onSync = (synced: boolean) => {
      if (!synced) return

      clearTimeout(timeout)
      provider.off("sync", onSync)
      resolve()
    }

    provider.on("sync", onSync)
  })
}
