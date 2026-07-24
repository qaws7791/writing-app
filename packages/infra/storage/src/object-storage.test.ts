import { describe, expect, it, vi } from "vitest"

import { createS3ObjectStorage } from "#storage/object-storage"

const config = {
  accessKeyId: "access",
  bucket: "assets",
  endpoint: "https://storage.example.test",
  publicBaseUrl: "https://cdn.example.test",
  region: "auto",
  secretAccessKey: "secret",
}

describe("S3-compatible object storage", () => {
  it("application retry를 중복하지 않고 provider operation을 한 번 호출한다", async () => {
    const send = vi.fn(async () => ({}))
    const result = createS3ObjectStorage(config, { client: { send } })
    if (result.isErr()) throw result.error

    const putResult = await result.value.putObject({
      body: new Uint8Array([1]),
      contentType: "application/octet-stream",
      objectKey: "folder/object.bin",
    })

    expect(putResult.isOk()).toBe(true)
    expect(send).toHaveBeenCalledOnce()
  })

  it("SDK exception의 cause를 typed infrastructure error에 보존한다", async () => {
    const cause = new Error("provider unavailable")
    const result = createS3ObjectStorage(config, {
      client: { send: async () => Promise.reject(cause) },
    })
    if (result.isErr()) throw result.error

    const putResult = await result.value.putObject({
      body: new Uint8Array([1]),
      contentType: "text/plain",
      objectKey: "object.txt",
    })
    expect(putResult.isErr()).toBe(true)
    if (putResult.isErr()) expect(putResult.error.cause).toBe(cause)
  })

  it("persisted object key를 public origin에서만 결정적으로 resolve한다", () => {
    const result = createS3ObjectStorage(config, {
      client: { send: async () => ({}) },
    })
    if (result.isErr()) throw result.error

    expect(result.value.resolveUrl("course covers/표지.webp")).toBe(
      "https://cdn.example.test/course%20covers/%ED%91%9C%EC%A7%80.webp"
    )
  })

  it("불완전한 config를 fail-closed한다", () => {
    expect(
      createS3ObjectStorage({ ...config, secretAccessKey: "" }).isErr()
    ).toBe(true)
  })
})
