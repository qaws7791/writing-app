import { describe, expect, it, vi } from "vitest"

import type { ResourceEventsConnector } from "@/features/resources/resource-events-client"
import { createResourceWorkspaceRealtime } from "@/features/resources/resource-workspace-realtime"

describe("자료실 작업 공간 실시간 연결", () => {
  it("문서를 100회 전환해도 실제 연결을 한 번만 만든다", () => {
    const subscribeDocument = vi.fn()
    const unsubscribeDocument = vi.fn()
    const connectEvents: ResourceEventsConnector = vi.fn(() => ({
      disconnect: vi.fn(),
      subscribeDocument,
      unsubscribeDocument,
    }))
    const realtime = createResourceWorkspaceRealtime({
      connectEvents,
      serverUrl: "ws://admin-api.test/resources/events",
    })

    realtime.start()
    for (let index = 0; index < 100; index += 1) {
      realtime.setActiveDocument({
        documentId: `document-${index}`,
        knownStateVersion: index,
      })
    }

    expect(connectEvents).toHaveBeenCalledTimes(1)
    expect(subscribeDocument).toHaveBeenCalledTimes(100)
    expect(unsubscribeDocument).toHaveBeenCalledTimes(99)
    realtime.dispose()
  })

  it("자료 트리 listener가 교체돼도 실제 연결을 하나만 유지한다", () => {
    const disconnect = vi.fn()
    const connectEvents: ResourceEventsConnector = vi.fn(() => ({
      disconnect,
      subscribeDocument: vi.fn(),
      unsubscribeDocument: vi.fn(),
    }))
    const realtime = createResourceWorkspaceRealtime({
      connectEvents,
      serverUrl: "ws://admin-api.test/resources/events",
    })

    realtime.start()
    const firstTree = realtime.connectTree({
      onConnectionChange: vi.fn(),
      onError: vi.fn(),
      onEvent: vi.fn(),
      serverUrl: "ignored",
    })
    firstTree.disconnect()
    const secondTree = realtime.connectTree({
      onConnectionChange: vi.fn(),
      onError: vi.fn(),
      onEvent: vi.fn(),
      serverUrl: "ignored",
    })
    secondTree.disconnect()

    expect(connectEvents).toHaveBeenCalledTimes(1)
    expect(disconnect).not.toHaveBeenCalled()

    realtime.dispose()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it("React Strict Effect cleanup 뒤 같은 작업 공간 연결을 다시 시작한다", () => {
    const connectEvents: ResourceEventsConnector = vi.fn(() => ({
      disconnect: vi.fn(),
      subscribeDocument: vi.fn(),
      unsubscribeDocument: vi.fn(),
    }))
    const realtime = createResourceWorkspaceRealtime({
      connectEvents,
      serverUrl: "ws://admin-api.test/resources/events",
    })

    realtime.start()
    realtime.dispose()
    realtime.start()

    expect(connectEvents).toHaveBeenCalledTimes(2)
    realtime.dispose()
  })

  it("같은 연결의 문서 version 사건을 동기화 listener에 전달한다", () => {
    let connectedInput: Parameters<ResourceEventsConnector>[0] | undefined
    const connectEvents: ResourceEventsConnector = vi.fn((input) => {
      connectedInput = input
      return {
        disconnect: vi.fn(),
        subscribeDocument: vi.fn(),
        unsubscribeDocument: vi.fn(),
      }
    })
    const realtime = createResourceWorkspaceRealtime({
      connectEvents,
      serverUrl: "ws://admin-api.test/resources/events",
    })
    const listener = vi.fn()

    realtime.subscribeDocumentEvents(listener)
    realtime.start()
    connectedInput?.onDocumentEvent?.({
      contentRevision: 3,
      documentId: "document-1",
      stateVersion: 4,
      type: "resource-document-version-advanced",
    })

    expect(listener).toHaveBeenCalledWith({
      contentRevision: 3,
      documentId: "document-1",
      stateVersion: 4,
      type: "resource-document-version-advanced",
    })
    realtime.dispose()
  })
})
