import { describe, expect, it } from "vitest"

import {
  createResourceImageObjectKey,
  markResourceAssetDeletePending,
  resourceImageMaxBytes,
  validateResourceImage,
  type ResourceAsset,
} from "#resource-library/domain/resource-asset"
import {
  readResourceAssetId,
  readResourceDocumentId,
} from "#resource-library/domain/resource-tree-node"

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

describe("resource asset domain policy", () => {
  it("실제 byte signature와 정규화한 alt text를 검증한다", () => {
    expect(
      validateResourceImage({ altText: "  운영 화면  ", bytes: png })
    ).toEqual({
      altText: "운영 화면",
      contentType: "image/png",
      status: "valid",
    })
    expect(
      validateResourceImage({
        altText: "운영 화면",
        bytes: new Uint8Array([1]),
      })
    ).toEqual({ reason: "unsupported-image", status: "invalid" })
    expect(validateResourceImage({ altText: " ", bytes: png })).toEqual({
      reason: "alt-text-empty",
      status: "invalid",
    })
  })

  it("5MB를 초과한 image를 object storage 호출 전에 거절한다", () => {
    expect(
      validateResourceImage({
        altText: "운영 화면",
        bytes: new Uint8Array(resourceImageMaxBytes + 1),
      })
    ).toEqual({ reason: "image-too-large", status: "invalid" })
  })

  it("document·asset ID와 실제 MIME으로 결정적 key를 만들고 삭제 대기로 전이한다", () => {
    const asset: ResourceAsset = Object.freeze({
      altText: "운영 화면",
      byteSize: png.byteLength,
      contentType: "image/png",
      createdAt: new Date("2026-07-18T00:00:00.000Z"),
      documentId: readResourceDocumentId("document/1"),
      id: readResourceAssetId("asset/1"),
      objectKey: "resource-library/document%2F1/asset%2F1.png",
      status: "active",
    })

    expect(
      createResourceImageObjectKey({
        assetId: asset.id,
        documentId: asset.documentId,
        mimeType: asset.contentType,
      })
    ).toBe(asset.objectKey)
    expect(markResourceAssetDeletePending(asset)).toEqual({
      ...asset,
      status: "delete-pending",
    })
    expect(asset.status).toBe("active")
  })
})
