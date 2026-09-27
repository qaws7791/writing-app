import type { ResultAsync } from "@workspace/kernel/result"

export type PrivateObjectStorageError = Readonly<{
  cause?: unknown
  kind: "configuration-invalid" | "operation-failed"
  operation: "configure" | "get-object" | "list-objects" | "put-object"
  retryable: boolean
}>

export type PrivateObjectStorage = Readonly<{
  getObject: (
    objectKey: string
  ) => ResultAsync<Uint8Array, PrivateObjectStorageError>
  listObjectKeys: (
    prefix: string
  ) => ResultAsync<readonly string[], PrivateObjectStorageError>
  putObject: (input: {
    readonly body: Uint8Array
    readonly contentType: string
    readonly objectKey: string
  }) => ResultAsync<void, PrivateObjectStorageError>
}>
