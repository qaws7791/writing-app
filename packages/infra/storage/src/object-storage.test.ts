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
  it("SDK exception의 cause를 typed infrastructure error에 보존한다", async () => {
    const cause = new Error("provider unavailable")
    const storage = createS3ObjectStorage(config, {
      client: { send: async () => Promise.reject(cause) },
    })._unsafeUnwrap()

    const putResult = await storage.putObject({
      body: new Uint8Array([1]),
      contentType: "text/plain",
      objectKey: "object.txt",
    })

    expect(putResult._unsafeUnwrapErr().cause).toBe(cause)
  })

  it("persisted object key를 public origin에서만 결정적으로 resolve한다", () => {
    const storage = createS3ObjectStorage(config, {
      client: { send: async () => ({}) },
    })._unsafeUnwrap()

    expect(storage.resolveUrl("course covers/표지.webp")).toBe(
      "https://cdn.example.test/course%20covers/%ED%91%9C%EC%A7%80.webp"
    )
  })

  it("1000개를 초과한 object 삭제를 provider 제한에 맞춰 나눈다", async () => {
    const send = vi.fn(async () => ({}))
    const storage = createS3ObjectStorage(config, {
      client: { send },
    })._unsafeUnwrap()
    const objectKeys = Array.from(
      { length: 1001 },
      (_, index) => `folder/object-${index}.bin`
    )

    expect((await storage.deleteObjects(objectKeys)).isOk()).toBe(true)
    expect(send).toHaveBeenCalledTimes(2)
  })

  it("provider가 일부 object 삭제 오류를 반환하면 전체 성공으로 숨기지 않는다", async () => {
    const send = vi.fn(async () => ({
      Errors: [{ Key: "folder/failed.bin" }],
    }))
    const storage = createS3ObjectStorage(config, {
      client: { send },
    })._unsafeUnwrap()

    const result = await storage.deleteObjects(["folder/failed.bin"])

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "operation-failed",
      operation: "delete-objects",
      retryable: true,
    })
  })

  it("빈 object 목록은 provider를 호출하지 않는다", async () => {
    const send = vi.fn(async () => ({}))
    const storage = createS3ObjectStorage(config, {
      client: { send },
    })._unsafeUnwrap()

    expect((await storage.deleteObjects([])).isOk()).toBe(true)
    expect(send).not.toHaveBeenCalled()
  })

  it("불완전한 config를 fail-closed한다", () => {
    expect(
      createS3ObjectStorage({ ...config, secretAccessKey: "" }).isErr()
    ).toBe(true)
  })
})
