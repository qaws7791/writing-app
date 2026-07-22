import { createS3ObjectStorage } from "@workspace/storage/object-storage"

import type { AdminAssetStoreEnv } from "@/config/env"

export type ResourceAssetStore = {
  readonly deleteObjects: (objectKeys: readonly string[]) => Promise<void>
  readonly putObject: (input: {
    readonly body: Uint8Array
    readonly contentType: "image/jpeg" | "image/png" | "image/webp"
    readonly objectKey: string
  }) => Promise<{ readonly url: string }>
}

export function createR2ResourceAssetStore(
  config: AdminAssetStoreEnv
): ResourceAssetStore {
  const storageResult = createS3ObjectStorage(config)
  if (storageResult.isErr()) throw storageResult.error
  const storage = storageResult.value

  return {
    async deleteObjects(objectKeys) {
      const result = await storage.deleteObjects(objectKeys)
      if (result.isErr()) throw result.error
    },
    async putObject(input) {
      const result = await storage.putObject(input)
      if (result.isErr()) throw result.error
      return result.value
    },
  }
}
