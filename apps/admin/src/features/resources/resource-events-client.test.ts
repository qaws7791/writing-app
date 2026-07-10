import { afterEach, describe, expect, it, vi } from "vitest"

import {
  classifyResourceEventRevision,
  connectBrowserResourceEvents,
  recordBrowserResourceEventRevisionGap,
} from "@/features/resources/resource-events-client"

describe("자료실 실시간 이벤트 revision", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    TestResourceEventsSocket.instances.length = 0
  })

  it("연결 상태를 알리고 첫 재연결을 250ms 뒤 한 번만 예약한다", () => {
    vi.useFakeTimers()
    vi.stubGlobal("WebSocket", TestResourceEventsSocket)
    const onConnectionChange = vi.fn()
    const subscription = connectBrowserResourceEvents({
      onConnectionChange,
      onError: vi.fn(),
      onEvent: vi.fn(),
      serverUrl: "ws://admin-api.test/resources/events",
    })
    const first = TestResourceEventsSocket.instances[0]

    expect(first).toBeDefined()
    expect(onConnectionChange).toHaveBeenCalledWith(false)
    first?.dispatchEvent(new Event("open"))
    expect(onConnectionChange).toHaveBeenLastCalledWith(true)

    first?.dispatchEvent(new Event("close"))
    expect(onConnectionChange).toHaveBeenLastCalledWith(false)
    vi.advanceTimersByTime(249)
    expect(TestResourceEventsSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(TestResourceEventsSocket.instances).toHaveLength(2)

    subscription.disconnect()
  })

  it("재연결 뒤 마지막 활성 문서를 같은 연결에서 다시 구독한다", () => {
    vi.useFakeTimers()
    vi.stubGlobal("WebSocket", TestResourceEventsSocket)
    const subscription = connectBrowserResourceEvents({
      onConnectionChange: vi.fn(),
      onError: vi.fn(),
      onEvent: vi.fn(),
      serverUrl: "ws://admin-api.test/resources/events",
    })
    const first = TestResourceEventsSocket.instances[0]

    subscription.subscribeDocument({
      documentId: "document-1",
      knownStateVersion: 0,
    })
    first?.dispatchEvent(new Event("open"))
    expect(first?.sentMessages).toEqual([
      JSON.stringify({
        documentId: "document-1",
        knownStateVersion: 0,
        type: "resource-document-subscribe",
      }),
    ])

    first?.dispatchEvent(new Event("close"))
    vi.advanceTimersByTime(250)
    const second = TestResourceEventsSocket.instances[1]
    second?.dispatchEvent(new Event("open"))

    expect(second?.sentMessages).toEqual(first?.sentMessages)
    subscription.disconnect()
  })

  it("열린 작업 공간 연결에서 heartbeat를 주기적으로 보낸다", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-11T05:38:00.000Z"))
    vi.stubGlobal("WebSocket", TestResourceEventsSocket)
    const subscription = connectBrowserResourceEvents({
      onConnectionChange: vi.fn(),
      onError: vi.fn(),
      onEvent: vi.fn(),
      serverUrl: "ws://admin-api.test/resources/events",
    })
    const socket = TestResourceEventsSocket.instances[0]

    socket?.dispatchEvent(new Event("open"))
    vi.advanceTimersByTime(15_000)

    expect(socket?.sentMessages.map((message) => JSON.parse(message))).toEqual([
      {
        sentAt: "2026-07-11T05:38:15.000Z",
        type: "resource-realtime-heartbeat",
      },
    ])
    subscription.disconnect()
  })

  it("문서 구독 확인을 트리 사건 오류로 처리하지 않는다", () => {
    vi.stubGlobal("WebSocket", TestResourceEventsSocket)
    const onError = vi.fn()
    const onDocumentEvent = vi.fn()
    const subscription = connectBrowserResourceEvents({
      onConnectionChange: vi.fn(),
      onDocumentEvent,
      onError,
      onEvent: vi.fn(),
      serverUrl: "ws://admin-api.test/resources/events",
    })
    const socket = TestResourceEventsSocket.instances[0]

    socket?.dispatchEvent(
      new MessageEvent("message", {
        data: JSON.stringify({
          documentId: "document-1",
          stateVersion: 3,
          type: "resource-document-subscription-confirmed",
        }),
      })
    )

    expect(onDocumentEvent).toHaveBeenCalledWith({
      documentId: "document-1",
      stateVersion: 3,
      type: "resource-document-subscription-confirmed",
    })
    expect(onError).not.toHaveBeenCalled()
    subscription.disconnect()
  })

  it("revision gap을 브라우저 performance entry로 기록한다", () => {
    performance.clearMarks("resource-tree.revision-gap")

    recordBrowserResourceEventRevisionGap({
      currentRevision: 4,
      incomingRevision: 7,
    })

    expect(
      performance.getEntriesByName("resource-tree.revision-gap")
    ).toHaveLength(1)
  })

  it.each([
    { current: null, expected: "gap", incoming: 1 },
    { current: 3, expected: "stale", incoming: 3 },
    { current: 3, expected: "stale", incoming: 2 },
    { current: 3, expected: "next", incoming: 4 },
    { current: 3, expected: "gap", incoming: 5 },
  ] as const)(
    "현재 $current에서 $incoming 수신을 $expected로 분류한다",
    ({ current, expected, incoming }) => {
      expect(classifyResourceEventRevision(current, incoming)).toBe(expected)
    }
  )
})

class TestResourceEventsSocket extends EventTarget {
  static readonly instances: TestResourceEventsSocket[] = []
  readonly sentMessages: string[] = []

  constructor(readonly url: string) {
    super()
    TestResourceEventsSocket.instances.push(this)
  }

  close(): void {}

  send(message: string): void {
    this.sentMessages.push(message)
  }
}
