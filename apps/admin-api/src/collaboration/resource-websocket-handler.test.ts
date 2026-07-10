import { describe, expect, it } from "vitest"
import { WebsocketProvider } from "y-websocket"
import { Doc } from "yjs"

import { createResourceEventsHub } from "@/collaboration/resource-events-hub"
import {
  createResourceWebSocketHandler,
  type ResourceWebSocketConnectionData,
} from "@/collaboration/resource-websocket-handler"
import { createYWebSocketBunAdapter } from "@/collaboration/y-websocket-bun-adapter"
import { adminResourceEventSchema } from "@workspace/contracts/admin"

describe("자료실 통합 WebSocket handler", () => {
  it("Yjs binary room과 JSON events 채널을 같은 Bun server에서 분리한다", async () => {
    const collaboration = createYWebSocketBunAdapter()
    const events = createResourceEventsHub()
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

        resolve(adminResourceEventSchema.parse(parsedJson))
      },
      { once: true }
    )
  })
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
