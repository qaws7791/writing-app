import { describe, expect, it, vi } from "vitest"

import { createS3PrivateObjectStorage } from "#storage/private-object-storage"

const config = {
  accessKeyId: "access",
  bucket: "private-markers",
  endpoint: "https://storage.example.test",
  region: "auto",
  secretAccessKey: "secret",
}

describe("private S3 object read contract", () => {
  it("모든 list page의 key를 순서대로 수집한다", async () => {
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

    const result = await storage.listObjectKeys("prefix/")

    expect({
      keys: result._unsafeUnwrap(),
      requests: send.mock.calls.map(([command]) => ({
        continuationToken: command.input.ContinuationToken,
        prefix: command.input.Prefix,
      })),
    }).toEqual({
      keys: ["prefix/a.json", "prefix/b.json"],
      requests: [
        { continuationToken: undefined, prefix: "prefix/" },
        { continuationToken: "next", prefix: "prefix/" },
      ],
    })
  })

  it("다음 token이 없는 truncated page를 실패로 처리한다", async () => {
    const storage = createS3PrivateObjectStorage(config, {
      client: {
        send: async () => ({
          Contents: [{ Key: "prefix/a.json" }],
          IsTruncated: true,
        }),
      },
    })._unsafeUnwrap()

    const result = await storage.listObjectKeys("prefix/")

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "operation-failed",
      operation: "list-objects",
      retryable: true,
    })
  })

  it("본문 없는 get 응답을 성공으로 처리하지 않는다", async () => {
    const storage = createS3PrivateObjectStorage(config, {
      client: { send: async () => ({}) },
    })._unsafeUnwrap()

    const result = await storage.getObject(
      "privacy/deletion-markers/marker.json"
    )

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "operation-failed",
      operation: "get-object",
      retryable: true,
    })
  })
})
