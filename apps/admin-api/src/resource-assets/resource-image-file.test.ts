import { describe, expect, it } from "vitest"

import {
  createResourceImageObjectKey,
  detectResourceImageMimeType,
} from "@/resource-assets/resource-image-file"

describe("자료 이미지 파일 검증", () => {
  it.each([
    ["image/jpeg", [0xff, 0xd8, 0xff]],
    ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    [
      "image/webp",
      [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
    ],
  ] as const)("파일 시그니처로 %s를 판별한다", (mimeType, bytes) => {
    expect(detectResourceImageMimeType(Uint8Array.from(bytes))).toBe(mimeType)
  })

  it("SVG나 확장자만 이미지인 데이터는 허용하지 않는다", () => {
    expect(
      detectResourceImageMimeType(
        new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>")
      )
    ).toBeNull()
  })

  it("문서와 자산 ID를 URL 경로와 분리된 객체 키로 만든다", () => {
    expect(
      createResourceImageObjectKey({
        assetId: "asset/1",
        documentId: "document/1",
        mimeType: "image/webp",
      })
    ).toBe("resource-library/document%2F1/asset%2F1.webp")
  })
})
