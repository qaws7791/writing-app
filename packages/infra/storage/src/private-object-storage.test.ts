import { describe, expect, it, vi } from "vitest"

import { createS3PrivateObjectStorage } from "#storage/private-object-storage"

const config = {
  accessKeyId: "access",
  bucket: "private-markers",
  endpoint: "https://storage.example.test",
  region: "auto",
  secretAccessKey: "secret",
}

const markerObjectKey = "privacy/deletion-markers/marker.json"

describe("private S3-compatible object storage", () => {
  it("object 기록 성공을 Result로 반환한다", async () => {
    const send = vi.fn(async () => ({}))
    const storage = createS3PrivateObjectStorage(config, {
      client: { send },
    })._unsafeUnwrap()

    const putResult = await storage.putObject({
      body: new Uint8Array([1]),
      contentType: "application/json",
      objectKey: markerObjectKey,
    })

    expect(putResult.isOk()).toBe(true)
    expect(send).toHaveBeenCalledOnce()
  })

  it("저장한 object 본문을 byte로 조회한다", async () => {
    const body = new TextEncoder().encode('{"userId":"user-1"}')
    const send = vi.fn(async () => ({
      Body: { transformToByteArray: async () => body },
    }))
    const storage = createS3PrivateObjectStorage(config, {
      client: { send },
    })._unsafeUnwrap()

    const getResult = await storage.getObject(markerObjectKey)

    expect(getResult._unsafeUnwrap()).toEqual(body)
  })

  it("모든 list page의 key를 결정적 순서로 수집한다", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({
        Contents: [{ Key: "prefix/a.json" }],
        IsTruncated: true,
        NextContinuationToken: "next",
      })
      .mockResolvedValueOnce({
        Contents: [{ Key: "prefix/b.json" }],
        IsTruncated: false,
      })
    const storage = createS3PrivateObjectStorage(config, {
      client: { send },
    })._unsafeUnwrap()

    const listResult = await storage.listObjectKeys("prefix/")

    expect(listResult._unsafeUnwrap()).toEqual([
      "prefix/a.json",
      "prefix/b.json",
    ])
    expect(send).toHaveBeenCalledTimes(2)
  })

  it("불완전한 private config를 fail-closed한다", () => {
    expect(
      createS3PrivateObjectStorage({ ...config, bucket: "" }).isErr()
    ).toBe(true)
  })
})
