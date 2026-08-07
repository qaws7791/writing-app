import { describe, expect, it, vi } from "vitest"

import { createContainerCleanupCoordinator } from "@/composition/container-cleanup"

describe("API container 초기화 정리", () => {
  it("cleanup 실패를 격리해 나머지 resource를 정리하고 반복 호출을 멱등 처리한다", async () => {
    const events: string[] = []
    const databaseError = new Error("database close failed")
    const onFailure = vi.fn()
    const loggerCleanup = vi.fn(() => {
      events.push("logger")
    })

    const cleanup = createContainerCleanupCoordinator({ onFailure })
    cleanup.register("logger", loggerCleanup)
    cleanup.register("database", () => {
      events.push("database")
      throw databaseError
    })

    const first = cleanup.dispose()
    const repeated = cleanup.dispose()

    expect(first).toBe(repeated)
    await expect(first).resolves.toEqual([
      { cause: databaseError, name: "database" },
    ])
    expect(events).toEqual(["database", "logger"])
    expect(onFailure).toHaveBeenCalledWith({
      cause: databaseError,
      name: "database",
    })
    expect(loggerCleanup).toHaveBeenCalledOnce()
  })
})
