import { describe, expect, it, vi } from "vitest"

import { createS3PrivateObjectStorage } from "#storage/private-object-storage"

const config = {
  accessKeyId: "access",
  bucket: "private-markers",
  endpoint: "https://storage.example.test",
  region: "auto",
  secretAccessKey: "secret",
}

describe("private S3-compatible object storage", () => {
  it("공개 URL을 만들지 않고 object를 기록·조회한다", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Body: {
          transformToByteArray: async () =>
            new TextEncoder().encode('{"userId":"user-1"}'),
        },
      })
    const storage = createS3PrivateObjectStorage(config, { client: { send } })
    if (storage.isErr()) throw storage.error

    await expect(
      storage.value.putObject({
        body: new Uint8Array([1]),
        contentType: "application/json",
        objectKey: "privacy/deletion-markers/marker.json",
      })
    ).resolves.toMatchObject({ value: undefined })
    await expect(
      storage.value.getObject("privacy/deletion-markers/marker.json")
    ).resolves.toMatchObject({
      value: expect.any(Uint8Array),
    })
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
    const storage = createS3PrivateObjectStorage(config, { client: { send } })
    if (storage.isErr()) throw storage.error

    await expect(
      storage.value.listObjectKeys("prefix/")
    ).resolves.toMatchObject({
      value: ["prefix/a.json", "prefix/b.json"],
    })
    expect(send).toHaveBeenCalledTimes(2)
  })

  it("불완전한 private config를 fail-closed한다", () => {
    expect(
      createS3PrivateObjectStorage({ ...config, bucket: "" }).isErr()
    ).toBe(true)
  })
})
