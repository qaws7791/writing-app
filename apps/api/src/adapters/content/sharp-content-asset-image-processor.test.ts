import sharp from "sharp"
import { describe, expect, it } from "vitest"

import { createSharpContentAssetImageProcessor } from "@/adapters/content/sharp-content-asset-image-processor"

describe("Sharp content asset image processor", () => {
  it("course cover를 1600x900 JPEG로 재인코딩하고 metadata를 제거한다", async () => {
    const source = await sharp({
      create: {
        background: { alpha: 1, b: 30, g: 20, r: 10 },
        channels: 4,
        height: 1_200,
        width: 2_000,
      },
    })
      .jpeg()
      .withMetadata({ orientation: 1 })
      .toBuffer()
    const processor = createSharpContentAssetImageProcessor()

    const result = await processor.process({
      bytes: source,
      contentType: "image/jpeg",
      kind: "course-cover",
    })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) return
    const metadata = await sharp(result.value.bytes).metadata()
    expect(metadata).toMatchObject({
      format: "jpeg",
      height: 900,
      width: 1_600,
    })
    expect(metadata.exif).toBeUndefined()
    expect(metadata.icc).toBeUndefined()
    expect(metadata.xmp).toBeUndefined()
  })

  it("reading illustration을 비율을 유지한 1440px 경계 안으로 줄인다", async () => {
    const source = await sharp({
      create: {
        background: { alpha: 1, b: 30, g: 20, r: 10 },
        channels: 4,
        height: 1_000,
        width: 2_000,
      },
    })
      .webp()
      .toBuffer()
    const processor = createSharpContentAssetImageProcessor()

    const result = await processor.process({
      bytes: source,
      contentType: "image/webp",
      kind: "reading-illustration",
    })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) return
    await expect(sharp(result.value.bytes).metadata()).resolves.toMatchObject({
      format: "webp",
      height: 720,
      width: 1_440,
    })
  })

  it("signature만 JPEG인 손상 파일은 decode 단계에서 거절한다", async () => {
    const processor = createSharpContentAssetImageProcessor()

    await expect(
      processor.process({
        bytes: new Uint8Array([0xff, 0xd8, 0xff, 0x00]),
        contentType: "image/jpeg",
        kind: "course-cover",
      })
    ).resolves.toMatchObject({
      error: { reason: "image-decode-failed" },
    })
  })
})
