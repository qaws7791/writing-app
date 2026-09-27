import type { ResultAsync } from "@workspace/kernel/result"

export type ObjectStorageError = Readonly<{
  cause?: unknown
  kind: "configuration-invalid" | "operation-failed"
  operation: "configure" | "delete-objects" | "put-object"
  retryable: boolean
}>

export type ObjectStorage = {
  readonly deleteObjects: (
    objectKeys: readonly string[]
  ) => ResultAsync<void, ObjectStorageError>
  readonly putObject: (input: {
    readonly body: Uint8Array
    readonly contentType: string
    readonly objectKey: string
  }) => ResultAsync<{ readonly url: string }, ObjectStorageError>
  readonly resolveUrl: (objectKey: string) => string
}
