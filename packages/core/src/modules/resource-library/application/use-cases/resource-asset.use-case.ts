import type { AdminResourceImageMimeType } from "@workspace/contracts/resource-library/data"

import type { ResourceAssetRepository } from "#core/modules/resource-library/application/ports/resource-asset.repository"
import {
  toResourceAssetId,
  toResourceDocumentId,
  type ResourceAssetId,
} from "#core/modules/resource-library/domain/resource-tree-node"

export type RegisterResourceImageCommand = {
  readonly assetId: string
  readonly byteSize: number
  readonly contentType: AdminResourceImageMimeType
  readonly createdAt: Date
  readonly documentId: string
  readonly objectKey: string
}

export type RegisterResourceImageResult =
  | { readonly kind: "not-found" }
  | { readonly kind: "ok" }

export type ResourceAssetUseCase = {
  readonly createAssetId: () => ResourceAssetId
  readonly registerImage: (
    command: RegisterResourceImageCommand
  ) => Promise<RegisterResourceImageResult>
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
