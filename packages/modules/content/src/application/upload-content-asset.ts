import { err, ok, type Result } from "@workspace/kernel/result"
import type {
  AdminId,
  CourseId,
  CurriculumVersionId,
} from "@workspace/types/ids"

import type {
  ContentApplicationDependencies,
  ContentAssetStoragePort,
} from "#content/application/ports/content-ports"
import {
  createContentAssetObjectKey,
  validateContentAssetUpload,
  type ContentAsset,
  type ContentAssetKind,
} from "#content/domain/content-asset"
import type { ContentError } from "#content/domain/content-error"

type UploadedContentAsset = Readonly<{
  asset: ContentAsset
  url: string
}>

type UploadContentAssetCommand = Readonly<{
  adminId: AdminId
  altText: string
  bytes: Uint8Array
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  declaredContentType: string
  kind: ContentAssetKind
}>

export type UploadContentAsset = (
  command: UploadContentAssetCommand
) => Promise<Result<UploadedContentAsset, ContentError>>

export function createUploadContentAsset(
  dependencies: ContentApplicationDependencies
): UploadContentAsset {
  return async (command) => {
    const validation = validateContentAssetUpload(command)
    if (validation.status === "invalid") {
      return err({
        kind: "content-asset-invalid",
        reason: validation.reason,
      })
    }

    const owner = await dependencies.repository.readAssetOwner({
      courseId: command.courseId,
      curriculumVersionId: command.curriculumVersionId,
    })
    if (owner === null) {
      return err({ kind: "content-not-found" })
    }
    if (owner.versionStatus === "published") {
      return err({ kind: "content-immutable-revision" })
    }
    if (dependencies.assetStorage === null) {
      return err({
        compensation: "not-required",
        kind: "content-asset-storage-failed",
        operation: "upload",
        retryable: false,
      })
    }

    let processed: Awaited<
      ReturnType<
        ContentApplicationDependencies["assetImageProcessor"]["process"]
      >
    >
    try {
      processed = await dependencies.assetImageProcessor.process({
        bytes: command.bytes,
        contentType: validation.contentType,
        kind: command.kind,
      })
    } catch (cause) {
      return err({
        cause,
        kind: "content-asset-invalid",
        reason: "image-decode-failed",
      })
    }
    if (processed.isErr()) {
      return err({
        kind: "content-asset-invalid",
        reason: processed.error.reason,
      })
    }

    const processedValidation = validateContentAssetUpload({
      altText: validation.altText,
      bytes: processed.value.bytes,
      declaredContentType: processed.value.contentType,
    })
    if (processedValidation.status === "invalid") {
      return err({
        kind: "content-asset-invalid",
        reason:
          processedValidation.reason === "image-too-large"
            ? "processed-image-too-large"
            : processedValidation.reason,
      })
    }

    const assetId = dependencies.assetIdGenerator.next()
    const objectKey = createContentAssetObjectKey({
      assetId,
      contentType: processedValidation.contentType,
      kind: command.kind,
    })
    const upload = await putContentAssetObject(
      dependencies.assetStorage,
      processed.value.bytes,
      processedValidation.contentType,
      objectKey
    )
    if (upload.isErr()) return err(upload.error)

    const now = dependencies.clock.now()
    const asset: ContentAsset = {
      altText: processedValidation.altText,
      byteSize: processed.value.bytes.byteLength,
      contentType: processedValidation.contentType,
      courseId: command.courseId,
      createdAt: now,
      curriculumVersionId: command.curriculumVersionId,
      id: assetId,
      kind: command.kind,
      objectKey,
      orphanedAt: null,
      status: "active",
      updatedAt: now,
    }

    let registered: Result<ContentAsset, ContentError>
    try {
      registered = await dependencies.repository.createAsset(asset)
    } catch (cause) {
      const compensation = await compensateContentAssetUpload(
        dependencies.assetStorage,
        objectKey
      )
      return compensation.isErr()
        ? err(compensation.error)
        : err({ cause, kind: "content-asset-persistence-failed" })
    }
    if (registered.isErr()) {
      const compensation = await compensateContentAssetUpload(
        dependencies.assetStorage,
        objectKey
      )
      return compensation.isErr()
        ? err(compensation.error)
        : err(registered.error)
    }

    return ok({ asset: registered.value, url: upload.value.url })
  }
}

async function putContentAssetObject(
  storage: ContentAssetStoragePort,
  bytes: Uint8Array,
  contentType: ContentAsset["contentType"],
  objectKey: string
): Promise<
  Result<
    Readonly<{ url: string }>,
    Extract<ContentError, { kind: "content-asset-storage-failed" }>
  >
> {
  try {
    const uploaded = await storage.putObject({
      body: bytes,
      contentType,
      objectKey,
    })
    return uploaded.isOk()
      ? ok(uploaded.value)
      : err({
          compensation: "not-required",
          kind: "content-asset-storage-failed",
          operation: "upload",
          retryable: uploaded.error.retryable,
        })
  } catch (cause) {
    return err({
      cause,
      compensation: "not-required",
      kind: "content-asset-storage-failed",
      operation: "upload",
      retryable: true,
    })
  }
}

async function compensateContentAssetUpload(
  storage: ContentAssetStoragePort,
  objectKey: string
): Promise<
  Result<void, Extract<ContentError, { kind: "content-asset-storage-failed" }>>
> {
  try {
    const deleted = await storage.deleteObjects([objectKey])
    return deleted.isOk()
      ? ok(undefined)
      : err({
          compensation: "failed",
          kind: "content-asset-storage-failed",
          operation: "compensate-delete",
          retryable: deleted.error.retryable,
        })
  } catch (cause) {
    return err({
      cause,
      compensation: "failed",
      kind: "content-asset-storage-failed",
      operation: "compensate-delete",
      retryable: true,
    })
  }
}
