import type { ResourceDocumentId } from "@workspace/types/ids"

import type {
  ResourceCommandResult,
  ResourceLibraryDependencies,
} from "#resource-library/application/ports/resource-library-ports"
import {
  authorizeResourceAccess,
  type ResourceActor,
} from "#resource-library/domain/resource-access-policy"
import {
  createResourceImageObjectKey,
  validateResourceImage,
  type ResourceAsset,
} from "#resource-library/domain/resource-asset"

type ResourceImageUpload = Readonly<{
  asset: ResourceAsset
  url: string
}>

export type ResourceAssetApplication = Readonly<{
  uploadImage: (input: {
    readonly actor: ResourceActor
    readonly altText: string
    readonly bytes: Uint8Array
    readonly documentId: ResourceDocumentId
  }) => Promise<ResourceCommandResult<ResourceImageUpload>>
}>

export function createResourceAssetApplication(
  dependencies: Pick<
    ResourceLibraryDependencies,
    | "assetAuditObserver"
    | "assetIdGenerator"
    | "assetRepository"
    | "clock"
    | "storage"
  >
): ResourceAssetApplication {
  return Object.freeze({
    async uploadImage(input) {
      if (authorizeResourceAccess(input.actor) === "forbidden") {
        return { kind: "resource-forbidden" }
      }

      const validation = validateResourceImage(input)
      if (validation.status === "invalid") {
        return {
          kind: "resource-validation",
          reason: validation.reason,
        }
      }
      if (dependencies.storage === null) {
        return {
          compensation: "not-required",
          kind: "resource-storage-failure",
          operation: "upload",
          retryable: false,
        }
      }

      const assetId = dependencies.assetIdGenerator.next()
      const objectKey = createResourceImageObjectKey({
        assetId,
        documentId: input.documentId,
        mimeType: validation.contentType,
      })
      const uploaded = await dependencies.storage.putObject({
        body: input.bytes,
        contentType: validation.contentType,
        objectKey,
      })
      if (uploaded.isErr()) {
        return {
          compensation: "not-required",
          kind: "resource-storage-failure",
          operation: "upload",
          retryable: uploaded.error.retryable,
        }
      }

      const asset: ResourceAsset = Object.freeze({
        altText: validation.altText,
        byteSize: input.bytes.byteLength,
        contentType: validation.contentType,
        createdAt: dependencies.clock.now(),
        documentId: input.documentId,
        id: assetId,
        objectKey,
        status: "active",
      })
      try {
        const registered = await dependencies.assetRepository.createAsset(asset)
        if (registered.kind === "ok") {
          return {
            kind: "ok",
            value: { asset, url: uploaded.value.url },
          }
        }

        const compensation = await compensateUpload(
          dependencies,
          asset,
          objectKey
        )
        return compensation === "failed"
          ? storageFailure(true, "failed")
          : {
              kind: "resource-not-found",
              target: "document",
            }
      } catch {
        const compensation = await compensateUpload(
          dependencies,
          asset,
          objectKey
        )
        return compensation === "failed"
          ? storageFailure(true, "failed")
          : {
              kind: "resource-persistence-failure",
              operation: "register-asset",
            }
      }
    },
  })
}

async function compensateUpload(
  dependencies: Pick<
    ResourceLibraryDependencies,
    "assetAuditObserver" | "storage"
  >,
  asset: ResourceAsset,
  objectKey: string
): Promise<"failed" | "succeeded"> {
  const deleted = await dependencies.storage?.deleteObjects([objectKey])
  if (deleted?.isOk()) return "succeeded"

  try {
    dependencies.assetAuditObserver({
      assetId: asset.id,
      documentId: asset.documentId,
      kind: "resource-asset-orphaned",
      objectKey,
    })
  } catch {
    // 감사 observer 실패가 보상 결과를 성공으로 바꾸지 않는다.
  }
  return "failed"
}

function storageFailure(
  retryable: boolean,
  compensation: "failed" | "not-required" | "succeeded"
): ResourceCommandResult<never> {
  return {
    compensation,
    kind: "resource-storage-failure",
    operation: "upload",
    retryable,
  }
}
