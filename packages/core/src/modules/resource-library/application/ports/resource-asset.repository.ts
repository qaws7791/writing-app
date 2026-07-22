import type { AdminResourceImageMimeType } from "@workspace/contracts/resource-library/data"

import type {
  ResourceAssetId,
  ResourceDocumentId,
} from "#core/modules/resource-library/domain/resource-tree-node"

export type CreateResourceAssetInput = {
  readonly byteSize: number
  readonly contentType: AdminResourceImageMimeType
  readonly createdAt: Date
  readonly documentId: ResourceDocumentId
  readonly id: ResourceAssetId
  readonly objectKey: string
}

export type ResourceAssetRepository = {
  readonly createAsset: (
    input: CreateResourceAssetInput
  ) => Promise<{ readonly kind: "not-found" } | { readonly kind: "ok" }>
}
