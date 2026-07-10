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

  constructor(readonly url: string) {
    super()
    TestResourceEventsSocket.instances.push(this)
  }

  close(): void {}
}
