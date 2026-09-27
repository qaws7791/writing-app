import { ResultAsync } from "@workspace/kernel/result"

import type { ObjectStorage, ObjectStorageError } from "#storage/object-storage"
import type {
  PrivateObjectStorage,
  PrivateObjectStorageError,
} from "#storage/private-object-storage"

export function createR2ObjectStorage(
  bucket: R2Bucket,
  publicBaseUrl: string
): ObjectStorage {
  const baseUrl = new URL(publicBaseUrl)
  const resolveUrl = (key: string) =>
    `${baseUrl.href.replace(/\/$/u, "")}/${key.split("/").map(encodeURIComponent).join("/")}`
  return {
    deleteObjects(keys) {
      return ResultAsync.fromPromise(
        deleteObjects(bucket, keys),
        (cause): ObjectStorageError => ({
          cause,
          kind: "operation-failed",
          operation: "delete-objects",
          retryable: true,
        })
      )
    },
    putObject(input) {
      return ResultAsync.fromPromise(
        bucket
          .put(input.objectKey, input.body, {
            httpMetadata: { contentType: input.contentType },
          })
          .then(() => ({ url: resolveUrl(input.objectKey) })),
        (cause): ObjectStorageError => ({
          cause,
          kind: "operation-failed",
          operation: "put-object",
          retryable: true,
        })
      )
    },
    resolveUrl,
  }
}

export function createR2PrivateObjectStorage(
  bucket: R2Bucket
): PrivateObjectStorage {
  return {
    getObject(key) {
      return ResultAsync.fromPromise(
        readObject(bucket, key),
        (cause): PrivateObjectStorageError => ({
          cause,
          kind: "operation-failed",
          operation: "get-object",
          retryable: true,
        })
      )
    },
    listObjectKeys(prefix) {
      return ResultAsync.fromPromise(
        listKeys(bucket, prefix),
        (cause): PrivateObjectStorageError => ({
          cause,
          kind: "operation-failed",
          operation: "list-objects",
          retryable: true,
        })
      )
    },
    putObject(input) {
      return ResultAsync.fromPromise(
        bucket
          .put(input.objectKey, input.body, {
            httpMetadata: { contentType: input.contentType },
          })
          .then(() => undefined),
        (cause): PrivateObjectStorageError => ({
          cause,
          kind: "operation-failed",
          operation: "put-object",
          retryable: true,
        })
      )
    },
  }
}

async function deleteObjects(
  bucket: R2Bucket,
  keys: readonly string[]
): Promise<void> {
  for (let offset = 0; offset < keys.length; offset += 1_000) {
    await bucket.delete(keys.slice(offset, offset + 1_000))
  }
}

async function readObject(bucket: R2Bucket, key: string): Promise<Uint8Array> {
  const object = await bucket.get(key)
  if (object === null) throw new Error("삭제 marker를 찾을 수 없습니다.")
  return new Uint8Array(await object.arrayBuffer())
}

async function listKeys(
  bucket: R2Bucket,
  prefix: string
): Promise<readonly string[]> {
  const keys: string[] = []
  let cursor: string | undefined
  do {
    const page = await bucket.list({
      prefix,
      ...(cursor === undefined ? {} : { cursor }),
    })
    keys.push(...page.objects.map((object) => object.key))
    cursor = page.truncated ? page.cursor : undefined
  } while (cursor !== undefined)
  return keys
}
