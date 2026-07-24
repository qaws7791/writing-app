import type { ContentAssetStoragePort } from "@workspace/content/ports"
import type { ObjectStorage } from "@workspace/storage/object-storage"

export function createContentAssetStorageAdapter(
  storage: ObjectStorage
): ContentAssetStoragePort {
  return {
    async deleteObjects(objectKeys) {
      const result = await storage.deleteObjects(objectKeys)
      return result.mapErr((error) => ({ retryable: error.retryable }))
    },
    async putObject(input) {
      const result = await storage.putObject(input)
      return result.mapErr((error) => ({ retryable: error.retryable }))
    },
    resolveUrl(objectKey) {
      return storage.resolveUrl(objectKey)
    },
  }
}
