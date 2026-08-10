import { DeleteObjectsCommand } from "@aws-sdk/client-s3"
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

describe("S3 object deletion contract", () => {
  it("provider 제한을 넘는 object 목록을 1000개 단위로 삭제한다", async () => {
    const send = vi.fn(async (_command: unknown) => ({}))
    const storage = createS3ObjectStorage(config, {
      client: { send },
    })._unsafeUnwrap()
    const objectKeys = Array.from(
      { length: 1001 },
      (_, index) => `folder/object-${index}.bin`
    )

    const result = await storage.deleteObjects(objectKeys)

    const sentBatches = send.mock.calls.map(([command]) =>
      readDeleteObjectsCommand(command)
    )

    expect({
      batchSizes: sentBatches.map(
        ({ input }) => (input.Delete?.Objects ?? []).length
      ),
      deletedKeys: sentBatches.flatMap(({ input }) =>
        (input.Delete?.Objects ?? []).map(({ Key }) => Key)
      ),
      succeeded: result.isOk(),
    }).toEqual({
      batchSizes: [1000, 1],
      deletedKeys: objectKeys,
      succeeded: true,
    })
  })

  it("provider의 부분 삭제 실패를 전체 성공으로 숨기지 않는다", async () => {
    const storage = createS3ObjectStorage(config, {
      client: {
        send: async () => ({ Errors: [{ Key: "folder/failed.bin" }] }),
      },
    })._unsafeUnwrap()

    const result = await storage.deleteObjects(["folder/failed.bin"])

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "operation-failed",
      operation: "delete-objects",
      retryable: true,
    })
  })

  it("빈 object 목록은 provider 요청 없이 성공한다", async () => {
    const send = vi.fn(async () => ({}))
    const storage = createS3ObjectStorage(config, {
      client: { send },
    })._unsafeUnwrap()

    const result = await storage.deleteObjects([])

    expect({
      providerCalls: send.mock.calls.length,
      succeeded: result.isOk(),
    }).toEqual({
      providerCalls: 0,
      succeeded: true,
    })
  })
})

function readDeleteObjectsCommand(command: unknown): DeleteObjectsCommand {
  if (!(command instanceof DeleteObjectsCommand)) {
    throw new Error("DeleteObjectsCommand가 필요합니다.")
  }
  return command
}
