import { describe, expect, it, vi } from "vitest"
import { errAsync, okAsync } from "@workspace/kernel/result"
import type { ObjectStorage } from "@workspace/storage/object-storage"

import { createResourceObjectStoragePort } from "@/composition/resource-library-module.composition"

describe("resource-library object storage adapter", () => {
  it("module policy input을 provider에 한 번 전달하고 성공 결과만 반환한다", async () => {
    const putObject = vi.fn(() =>
      okAsync({ url: "https://assets.example.test/document/asset.png" })
    )
    const storage = createResourceObjectStoragePort(
      createObjectStorage({ putObject })
    )
    const input = {
      body: new Uint8Array([1, 2, 3]),
      contentType: "image/png" as const,
      objectKey: "resource-library/document/asset.png",
    }

    const result = await storage.putObject(input)

    expect(result).toEqual(
      expect.objectContaining({
        value: { url: "https://assets.example.test/document/asset.png" },
      })
    )
    expect(result.isOk()).toBe(true)
    expect(putObject).toHaveBeenCalledOnce()
    expect(putObject).toHaveBeenCalledWith(input)
  })

  it("provider cause를 module 밖으로 노출하지 않고 retryability만 보존한다", async () => {
    const providerCause = new Error("secret provider response")
    const storage = createResourceObjectStoragePort(
      createObjectStorage({
        deleteObjects: () =>
          errAsync({
            cause: providerCause,
            kind: "operation-failed",
            operation: "delete-objects",
            retryable: true,
          }),
      })
    )

    const result = await storage.deleteObjects(["resource/object.png"])

    expect(result.isErr()).toBe(true)
    if (result.isErr()) expect(result.error).toEqual({ retryable: true })
    expect(JSON.stringify(result)).not.toContain("secret provider response")
  })
})

function createObjectStorage(
  overrides: Partial<ObjectStorage> = {}
): ObjectStorage {
  return {
    deleteObjects: () => okAsync(undefined),
    putObject: () => okAsync({ url: "https://assets.example.test/object" }),
    ...overrides,
  }
}
