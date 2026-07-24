import type {
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
} from "@workspace/types/ids"

export const contentAssetMaxBytes = 5 * 1024 * 1024
export const contentAssetAltTextMaxLength = 500
export const contentAssetOrphanRetentionMs = 7 * 24 * 60 * 60 * 1_000

export const contentAssetKindValues = [
  "course-cover",
  "reading-illustration",
] as const
export type ContentAssetKind = (typeof contentAssetKindValues)[number]

export const contentAssetMimeTypeValues = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const
export type ContentAssetMimeType = (typeof contentAssetMimeTypeValues)[number]

export const contentAssetStatusValues = ["active", "orphaned"] as const
type ContentAssetStatus = (typeof contentAssetStatusValues)[number]

export type ContentAsset = Readonly<{
  altText: string
  byteSize: number
  contentType: ContentAssetMimeType
  courseId: CourseId
  createdAt: Date
  curriculumVersionId: CurriculumVersionId
  id: ContentAssetId
  kind: ContentAssetKind
  objectKey: string
  orphanedAt: Date | null
  status: ContentAssetStatus
  updatedAt: Date
}>

export type ContentAssetValidationReason =
  | "alt-text-empty"
  | "alt-text-too-long"
  | "image-decode-failed"
  | "image-empty"
  | "image-too-large"
  | "processed-image-too-large"
  | "signature-mismatch"
  | "unsupported-content-type"

export type ContentAssetUploadValidation =
  | Readonly<{
      altText: string
      contentType: ContentAssetMimeType
      status: "valid"
    }>
  | Readonly<{
      reason: ContentAssetValidationReason
      status: "invalid"
    }>

const imageExtensions: Readonly<Record<ContentAssetMimeType, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export function validateContentAssetUpload(input: {
  readonly altText: string
  readonly bytes: Uint8Array
  readonly declaredContentType: string
}): ContentAssetUploadValidation {
  const altText = input.altText.normalize("NFC").trim()
  if (altText.length === 0) {
    return { reason: "alt-text-empty", status: "invalid" }
  }
  if (altText.length > contentAssetAltTextMaxLength) {
    return { reason: "alt-text-too-long", status: "invalid" }
  }
  if (input.bytes.byteLength === 0) {
    return { reason: "image-empty", status: "invalid" }
  }
  if (input.bytes.byteLength > contentAssetMaxBytes) {
    return { reason: "image-too-large", status: "invalid" }
  }
  if (!isContentAssetMimeType(input.declaredContentType)) {
    return { reason: "unsupported-content-type", status: "invalid" }
  }

  const detectedContentType = detectContentAssetMimeType(input.bytes)
  if (
    detectedContentType === null ||
    detectedContentType !== input.declaredContentType
  ) {
    return { reason: "signature-mismatch", status: "invalid" }
  }

  return {
    altText,
    contentType: detectedContentType,
    status: "valid",
  }
}

export function createContentAssetObjectKey(input: {
  readonly assetId: ContentAssetId
  readonly contentType: ContentAssetMimeType
  readonly kind: ContentAssetKind
}): string {
  const assetId = encodeURIComponent(input.assetId)
  return `content-assets/${input.kind}/${assetId}.${imageExtensions[input.contentType]}`
}

function isContentAssetMimeType(value: string): value is ContentAssetMimeType {
  return contentAssetMimeTypeValues.some((contentType) => contentType === value)
}

function detectContentAssetMimeType(
  bytes: Uint8Array
): ContentAssetMimeType | null {
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
