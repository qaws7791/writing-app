import { describe, expect, it, vi } from "vitest"

import { createInMemoryEventBus } from "#event-bus/in-memory-event-bus"

type TestEvents = {
  readonly completed: { readonly id: string }
}

describe("best-effort process-local in-memory event delivery", () => {
  it("publish는 모든 listener의 비동기 완료를 기다리고 순차 순서에 의존하지 않는다", async () => {
    const bus = createInMemoryEventBus<TestEvents>()
    let finishSlowListener = (): void => undefined
    const execution: string[] = []
    bus.subscribe("completed", async () => {
      execution.push("slow-start")
      await new Promise<void>((resolve) => {
        finishSlowListener = resolve
      })
      execution.push("slow-finish")
    })
    bus.subscribe("completed", () => {
      execution.push("fast")
    })

    const publish = bus.publish("completed", { id: "1" })
    await vi.waitFor(() => expect(execution).toContain("fast"))
    expect(execution).toContain("slow-start")
    finishSlowListener()

    expect((await publish).isOk()).toBe(true)
    expect(execution).toContain("slow-finish")
  })

  it("여러 listener 실패 cause를 모두 보존한다", async () => {
    const bus = createInMemoryEventBus<TestEvents>()
    const first = new Error("first")
    const second = new Error("second")
    bus.subscribe("completed", () => {
      throw first
    })
    bus.subscribe("completed", async () => {
      throw second
    })

    const result = await bus.publish("completed", { id: "1" })
    expect(result.isErr()).toBe(true)
    if (result.isErr()) expect(result.error.causes).toEqual([first, second])
  })

  it("unsubscribe는 teardown 이후 delivery를 중단한다", async () => {
    const bus = createInMemoryEventBus<TestEvents>()
    const listener = vi.fn()
    const unsubscribe = bus.subscribe("completed", listener)
    unsubscribe()
    unsubscribe()

    expect((await bus.publish("completed", { id: "1" })).isOk()).toBe(true)
    expect(listener).not.toHaveBeenCalled()
  })
})
