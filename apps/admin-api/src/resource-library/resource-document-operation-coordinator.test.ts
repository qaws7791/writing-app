import { describe, expect, it, vi } from "vitest"

import { createResourceDocumentOperationCoordinator } from "@/resource-library/resource-document-operation-coordinator"

describe("자료 문서 operation coordinator", () => {
  it("같은 문서 operation은 순서대로 실행하고 다른 문서는 격리한다", async () => {
    const coordinator = createResourceDocumentOperationCoordinator()
    const saveGate = deferred<void>()
    const events: string[] = []

    const save = coordinator.run("document-1", async () => {
      events.push("save-start")
      await saveGate.promise
      events.push("save-end")
    })
    await vi.waitFor(() => expect(events).toEqual(["save-start"]))
    const exportDocument = coordinator.run("document-1", async () => {
      events.push("export")
    })
    const otherDocument = coordinator.run("document-2", async () => {
      events.push("other")
    })

    await otherDocument
    expect(events).toEqual(["save-start", "other"])
    saveGate.resolve()
    await Promise.all([save, exportDocument])
    expect(events).toEqual(["save-start", "other", "save-end", "export"])
  })

  it("하위 문서 묶음을 먼저 예약해 후속 operation의 끼어들기를 막는다", async () => {
    const coordinator = createResourceDocumentOperationCoordinator()
    const firstGate = deferred<void>()
    const events: string[] = []
    const first = coordinator.run("document-1", async () => {
      events.push("first")
      await firstGate.promise
    })
    await vi.waitFor(() => expect(events).toEqual(["first"]))
    const trash = coordinator.runMany(
      ["document-2", "document-1", "document-2"],
      async () => {
        events.push("trash")
      }
    )
    const later = coordinator.run("document-2", async () => {
      events.push("later")
    })

    await Promise.resolve()
    expect(events).toEqual(["first"])
    firstGate.resolve()
    await Promise.all([first, trash, later])
    expect(events).toEqual(["first", "trash", "later"])
  })
})

function deferred<TValue>() {
  let resolve: (value: TValue | PromiseLike<TValue>) => void = () => undefined
  const promise = new Promise<TValue>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}
