import { describe, expect, it, vi } from "vitest"

import {
  createCourseThumbnailUpload,
  getCourseThumbnailObjectKey,
} from "@/storage/course-thumbnail-upload"

describe("getCourseThumbnailObjectKey", () => {
  it("creates a server-owned thumbnail key from content type", () => {
    expect(
      getCourseThumbnailObjectKey({
        contentType: "image/webp",
        id: "asset-1",
      })
    ).toBe("course-thumbnails/asset-1.webp")
  })
})

describe("createCourseThumbnailUpload", () => {
  it("returns a signed PUT contract and public thumbnail path", async () => {
    const createUploadUrl = vi.fn(async () => "http://signed-upload.local")

    await expect(
      createCourseThumbnailUpload(
        {
          fileName: "사용자 파일.png",
          contentType: "image/png",
          contentLength: 128,
        },
        {
          bucket: "writing-app-public-assets",
          createId: () => "asset-1",
          createUploadUrl,
          publicBaseUrl: "http://localhost:9000/writing-app-public-assets/",
        }
      )
    ).resolves.toEqual({
      uploadUrl: "http://signed-upload.local",
      method: "PUT",
      headers: {
        "content-type": "image/png",
      },
      thumbnailPath:
        "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset-1.png",
    })

    expect(createUploadUrl).toHaveBeenCalledWith({
      bucket: "writing-app-public-assets",
      key: "course-thumbnails/asset-1.png",
      contentType: "image/png",
    })
  })
})
