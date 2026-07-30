import { describe, expect, it } from "vitest"
import type { ContentAssetId } from "@workspace/types/ids"

import {
  contentAssetMaxBytes,
  createContentAssetObjectKey,
  validateContentAssetUpload,
} from "#content/domain/content-asset"

describe("content asset domain", () => {
  it.each([
    ["image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0x00])],
    [
      "image/png",
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ],
    [
      "image/webp",
      new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ]),
    ],
  ] as const)("%s signature를 허용한다", (declaredContentType, bytes) => {
    expect(
      validateContentAssetUpload({
        altText: "  예시 이미지  ",
        bytes,
        declaredContentType,
      })
    ).toEqual({
      altText: "예시 이미지",
      contentType: declaredContentType,
      status: "valid",
    })
  })

  it.each([
    ["image/svg+xml", new TextEncoder().encode("<svg />")],
    ["image/gif", new TextEncoder().encode("GIF89a")],
    ["image/tiff", new Uint8Array([0x49, 0x49, 0x2a, 0x00])],
  ])("지원하지 않는 %s를 거절한다", (declaredContentType, bytes) => {
    expect(
      validateContentAssetUpload({
        altText: "대체 텍스트",
        bytes,
        declaredContentType,
      })
    ).toMatchObject({ status: "invalid" })
  })

  it("선언 MIME과 signature가 다르면 거절한다", () => {
    expect(
      validateContentAssetUpload({
        altText: "대체 텍스트",
        bytes: new Uint8Array([0xff, 0xd8, 0xff, 0x00]),
        declaredContentType: "image/png",
      })
    ).toEqual({ reason: "signature-mismatch", status: "invalid" })
  })

  it("상한과 같은 크기의 이미지는 허용한다", () => {
    expect(
      validateContentAssetUpload({
        altText: "대체 텍스트",
        bytes: aJpegOfBytes(contentAssetMaxBytes),
        declaredContentType: "image/jpeg",
      })
    ).toEqual({
      altText: "대체 텍스트",
      contentType: "image/jpeg",
      status: "valid",
    })
  })

  it("상한을 1byte 넘긴 이미지를 거절한다", () => {
    expect(
      validateContentAssetUpload({
        altText: "대체 텍스트",
        bytes: new Uint8Array(contentAssetMaxBytes + 1),
        declaredContentType: "image/jpeg",
      })
    ).toEqual({ reason: "image-too-large", status: "invalid" })
  })

  it("공백만 남는 alt text를 거절한다", () => {
    expect(
      validateContentAssetUpload({
        altText: "  ",
        bytes: new Uint8Array([0xff, 0xd8, 0xff]),
        declaredContentType: "image/jpeg",
      })
    ).toEqual({ reason: "alt-text-empty", status: "invalid" })
  })

  it("object key를 서버 생성 asset ID와 고정 kind로만 만든다", () => {
    expect(
      createContentAssetObjectKey({
        assetId: "asset/../사용자 입력" as ContentAssetId,
        contentType: "image/webp",
        kind: "course-cover",
      })
    ).toBe(
      "content-assets/course-cover/asset%2F..%2F%EC%82%AC%EC%9A%A9%EC%9E%90%20%EC%9E%85%EB%A0%A5.webp"
    )
  })
})

function aJpegOfBytes(byteLength: number): Uint8Array {
  const bytes = new Uint8Array(byteLength)
  bytes.set([0xff, 0xd8, 0xff, 0x00])
  return bytes
}
