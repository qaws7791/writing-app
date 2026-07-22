import type {
  ResourceAssetId,
  ResourceDocumentId,
  ResourceNodeId,
} from "@workspace/types/ids"

export const resourceImageMaxBytes = 5 * 1024 * 1024
const resourceImageAltTextMaxLength = 500

export type ResourceImageMimeType = "image/jpeg" | "image/png" | "image/webp"
type ResourceAssetStatus = "active" | "delete-pending"

export type ResourceAsset = Readonly<{
  altText: string
  byteSize: number
  contentType: ResourceImageMimeType
  createdAt: Date
  documentId: ResourceDocumentId
  id: ResourceAssetId
  objectKey: string
  status: ResourceAssetStatus
}>

export type PendingResourceAssetDeletion = Readonly<{
  assetId: ResourceAssetId
  deleteRootId: ResourceNodeId
  objectKey: string
  requestedAt: Date
}>

export type ResourceImageValidation =
  | Readonly<{
      altText: string
      contentType: ResourceImageMimeType
      status: "valid"
    }>
  | Readonly<{
      reason:
        | "alt-text-empty"
        | "alt-text-too-long"
        | "image-empty"
        | "image-too-large"
        | "unsupported-image"
      status: "invalid"
    }>

const imageExtensions: Readonly<Record<ResourceImageMimeType, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export function validateResourceImage(input: {
  readonly altText: string
  readonly bytes: Uint8Array
}): ResourceImageValidation {
  const altText = input.altText.normalize("NFC").trim()
  if (altText.length === 0) {
    return { reason: "alt-text-empty", status: "invalid" }
  }
  if (altText.length > resourceImageAltTextMaxLength) {
    return { reason: "alt-text-too-long", status: "invalid" }
  }
  if (input.bytes.byteLength === 0) {
    return { reason: "image-empty", status: "invalid" }
  }
  if (input.bytes.byteLength > resourceImageMaxBytes) {
    return { reason: "image-too-large", status: "invalid" }
  }

  const contentType = detectResourceImageMimeType(input.bytes)
  return contentType === null
    ? { reason: "unsupported-image", status: "invalid" }
    : { altText, contentType, status: "valid" }
}

function detectResourceImageMimeType(
  bytes: Uint8Array
): ResourceImageMimeType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg"
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png"
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp"
  }
  return null
}

export function createResourceImageObjectKey(input: {
  readonly assetId: ResourceAssetId
  readonly documentId: ResourceDocumentId
  readonly mimeType: ResourceImageMimeType
}): string {
  return `resource-library/${encodeURIComponent(input.documentId)}/${encodeURIComponent(input.assetId)}.${imageExtensions[input.mimeType]}`
}

export function markResourceAssetDeletePending(
  asset: ResourceAsset
): ResourceAsset {
  return Object.freeze({ ...asset, status: "delete-pending" })
}
