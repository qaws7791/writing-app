import { describe, expect, it, vi } from "vitest"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { okAsync } from "@workspace/kernel/result"
import type { PrivateObjectStorage } from "@workspace/storage/private-object-storage"

import {
  createInMemoryDeletionMarkerStore,
  createS3DeletionMarkerStore,
} from "@/adapters/identity/deletion-marker-store"

const requestedAt = new Date("2026-07-24T00:00:00.000Z")
const userId = userIdSchema.parse("user-1")

describe("외부 삭제 marker store", () => {
  it("private prefix에 userId와 requestedAt만 가진 one-object marker를 기록한다", async () => {
    const storage = createStorageFake()
    const store = createS3DeletionMarkerStore({
      idGenerator: { next: () => "marker-1" },
      objectStorage: storage,
      prefix: "privacy/deletion-markers",
    })

    await expect(store.record({ requestedAt, userId })).resolves.toMatchObject({
      value: undefined,
    })
    expect(storage.putObject).toHaveBeenCalledOnce()
    const input = vi.mocked(storage.putObject).mock.calls[0]?.[0]
    expect(input?.objectKey).toBe(
      `privacy/deletion-markers/${requestedAt.getTime()}-marker-1.json`
    )
    expect(
      JSON.parse(new TextDecoder().decode(input?.body)) as unknown
    ).toEqual({
      requestedAt: requestedAt.toISOString(),
      userId: "user-1",
    })
  })

  it("strict marker만 읽고 PII가 섞인 object는 전체 조회를 실패시킨다", async () => {
    const body = new TextEncoder().encode(
      JSON.stringify({
        email: "person@example.test",
        requestedAt: requestedAt.toISOString(),
        userId,
      })
    )
    const storage = createStorageFake({
      bodies: new Map([["privacy/deletion-markers/marker.json", body]]),
      keys: ["privacy/deletion-markers/marker.json"],
    })
    const store = createS3DeletionMarkerStore({
      idGenerator: { next: () => "marker-1" },
      objectStorage: storage,
      prefix: "privacy/deletion-markers",
    })

    const result = await store.readAll()

    expect(result).toMatchObject({
      error: { kind: "deletion-marker-storage-failed" },
    })
    const recordedCause = result.isErr()
      ? `${String(result.error.cause)}${JSON.stringify(result.error.cause)}`
      : ""
    expect(recordedCause).not.toContain("person@example.test")
  })

  it("non-production in-memory adapter도 marker를 복제해 결정적으로 읽는다", async () => {
    const store = createInMemoryDeletionMarkerStore()
    const mutableRequestedAt = new Date(requestedAt)
    await store.record({ requestedAt: mutableRequestedAt, userId })
    mutableRequestedAt.setUTCFullYear(2030)

    await expect(store.readAll()).resolves.toMatchObject({
      value: [
        {
          requestedAt: new Date("2026-07-24T00:00:00.000Z"),
          userId,
        },
      ],
    })
  })
})

function createStorageFake(
  input: Readonly<{
    bodies?: ReadonlyMap<string, Uint8Array>
    keys?: readonly string[]
  }> = {}
): PrivateObjectStorage {
  return {
    getObject: vi.fn((objectKey: string) =>
      okAsync(input.bodies?.get(objectKey) ?? new Uint8Array())
    ),
    listObjectKeys: vi.fn(() => okAsync(input.keys ?? [])),
    putObject: vi.fn(() => okAsync(undefined)),
  }
}
