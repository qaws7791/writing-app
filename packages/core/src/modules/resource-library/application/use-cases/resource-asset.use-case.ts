import type { AdminResourceImageMimeType } from "@workspace/contracts/admin"

import type { ResourceAssetRepository } from "#core/modules/resource-library/application/ports/resource-asset.repository"
import {
  toResourceAssetId,
  toResourceDocumentId,
  type ResourceAssetId,
} from "#core/modules/resource-library/domain/resource-tree-node"

export type ResourceAssetUseCase = {
  readonly createAssetId: () => ResourceAssetId
  readonly registerImage: (input: {
    readonly assetId: string
    readonly byteSize: number
    readonly contentType: AdminResourceImageMimeType
    readonly createdAt: Date
    readonly documentId: string
    readonly objectKey: string
  }) => Promise<{ readonly kind: "not-found" } | { readonly kind: "ok" }>
}

export function createResourceAssetUseCase({
  assetRepository,
  createAssetId,
}: {
  readonly assetRepository: ResourceAssetRepository
  readonly createAssetId: () => ResourceAssetId
}): ResourceAssetUseCase {
  return {
    createAssetId,
    registerImage(input) {
      return assetRepository.createAsset({
        ...input,
        documentId: toResourceDocumentId(input.documentId),
        id: toResourceAssetId(input.assetId),
      })
    },
  }
}
