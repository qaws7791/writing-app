import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { applyUpdate, Doc } from "yjs"

import { createResourceDocumentTransactionQueue } from "@/features/resources/editor/resource-document-transaction-queue"
import type { AdminResourceDocumentTransactionInput } from "@/lib/api/admin-api"

describe("자료 문서 HTTP transaction queue", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("500ms 유휴 구간의 update를 하나의 transaction으로 합친다", async () => {
    const updates = createUpdates("첫째", "둘째")
    const calls: [string, AdminResourceDocumentTransactionInput][] = []
    const save = vi.fn(
      async (
        documentId: string,
        transaction: AdminResourceDocumentTransactionInput
      ) => {
        calls.push([documentId, transaction])
        return {
          status: "ok" as const,
          value: {
            contentRevision: 3,
            kind: "accepted" as const,
            stateVersion: 4,
            transactionId: "transaction-1",
          },
        }
      }
    )
    const onAccepted = vi.fn()
    const queue = createResourceDocumentTransactionQueue({
      createTransactionId: () => "transaction-1",
      documentId: "document-1",
      knownStateVersion: 3,
      onAccepted,
      onError: vi.fn(),
      save,
    })

    const [firstUpdate, secondUpdate] = updates
    if (firstUpdate === undefined || secondUpdate === undefined) {
      throw new Error("Yjs update fixture 생성 실패")
    }
    queue.enqueue(firstUpdate)
    await vi.advanceTimersByTimeAsync(300)
    queue.enqueue(secondUpdate)
    await vi.advanceTimersByTimeAsync(499)
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(save).toHaveBeenCalledTimes(1)
    const sentUpdate = calls[0]?.[1].update
    if (sentUpdate === undefined) throw new Error("저장 update 누락")
    const replica = new Doc()
    applyUpdate(replica, sentUpdate)
    expect(replica.getMap("content").get("value")).toBe("둘째")
    expect(onAccepted).toHaveBeenCalledWith({
      contentRevision: 3,
      stateVersion: 4,
    })
  })

  it("연속 입력은 늦어도 1초에 transaction을 만들고 실패하면 같은 키로 재시도한다", async () => {
    const [update] = createUpdates("본문")
    if (update === undefined) throw new Error("Yjs update fixture 생성 실패")
    const calls: [string, AdminResourceDocumentTransactionInput][] = []
    let attempt = 0
    const save = vi.fn(
      async (
        documentId: string,
        transaction: AdminResourceDocumentTransactionInput
      ) => {
        calls.push([documentId, transaction])
        attempt += 1
        if (attempt === 1) {
          return {
            error: {
              code: "contract-error" as const,
              message: "일시적 실패",
              status: 503,
            },
            status: "error" as const,
          }
        }
        return {
          status: "ok" as const,
          value: {
            contentRevision: 2,
            kind: "accepted" as const,
            stateVersion: 2,
            transactionId: "fixed-transaction",
          },
        }
      }
    )
    const queue = createResourceDocumentTransactionQueue({
      createTransactionId: () => "fixed-transaction",
      documentId: "document-1",
      knownStateVersion: 1,
      onAccepted: vi.fn(),
      onError: vi.fn(),
      save,
    })

    for (let elapsed = 0; elapsed < 1_000; elapsed += 250) {
      queue.enqueue(update)
      await vi.advanceTimersByTimeAsync(250)
    }

    expect(save).toHaveBeenCalledTimes(1)
    const firstInput = calls[0]?.[1]
    await queue.retry()
    expect(save).toHaveBeenCalledTimes(2)
    expect(calls[1]?.[1]).toEqual(firstInput)
  })
})

function createUpdates(...values: string[]): Uint8Array[] {
  const document = new Doc()
  const updates: Uint8Array[] = []
  document.on("update", (update) => updates.push(update))

  for (const value of values) document.getMap("content").set("value", value)
  document.destroy()
  return updates
}
