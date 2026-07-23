import { describe, expect, it, vi } from "vitest"

import {
  createContainerCleanupCoordinator,
  type ContainerCleanupName,
} from "@/composition/container-cleanup"

const initializationStages = [
  "logger",
  "database",
  "ai",
  "storage",
  "auth",
  "content",
  "identity",
  "ai-feedback",
  "learning",
  "resource-library",
  "operations",
  "routes",
] as const

describe("API container 초기화 정리", () => {
  it.each(initializationStages)(
    "%s 초기화 지점 실패에서 생성된 resource만 역순으로 정리한다",
    async (failurePoint) => {
      const cleanup = createContainerCleanupCoordinator()
      const events: string[] = []

      for (const stage of initializationStages) {
        if (stage === failurePoint) break
        const cleanupName = cleanupNameByStage(stage)
        if (cleanupName !== null) {
          cleanup.register(cleanupName, () => {
            events.push(cleanupName)
          })
        }
      }

      await cleanup.dispose()

      expect(events).toEqual(
        initializedCleanupNamesBefore(failurePoint).reverse()
      )
    }
  )

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
    cleanup.register("ai", () => {
      events.push("ai")
    })

    const first = cleanup.dispose()
    const repeated = cleanup.dispose()

    expect(first).toBe(repeated)
    await expect(first).resolves.toEqual([
      { cause: databaseError, name: "database" },
    ])
    expect(events).toEqual(["ai", "database", "logger"])
    expect(onFailure).toHaveBeenCalledWith({
      cause: databaseError,
      name: "database",
    })
    expect(loggerCleanup).toHaveBeenCalledOnce()
  })
})

function cleanupNameByStage(
  stage: (typeof initializationStages)[number]
): ContainerCleanupName | null {
  switch (stage) {
    case "logger":
      return "logger"
    case "database":
      return "database"
    case "ai":
      return "ai"
    case "storage":
    case "auth":
    case "content":
    case "identity":
    case "ai-feedback":
    case "learning":
    case "resource-library":
    case "operations":
    case "routes":
      return null
  }
}

function initializedCleanupNamesBefore(
  failurePoint: (typeof initializationStages)[number]
): ContainerCleanupName[] {
  return initializationStages
    .slice(0, initializationStages.indexOf(failurePoint))
    .flatMap((stage) => {
      const name = cleanupNameByStage(stage)
      return name === null ? [] : [name]
    })
}
