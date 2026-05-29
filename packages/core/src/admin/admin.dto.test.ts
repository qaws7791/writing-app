import { describe, expect, it } from "vitest"

import {
  adminCreateCourseThumbnailUploadDtoSchema,
  adminCreateCourseThumbnailUploadRequestDtoSchema,
} from "@/admin/admin.dto"
import { adminStorageUnavailableErrorDtoSchema } from "@/admin/admin.errors"

describe("adminCreateCourseThumbnailUploadRequestDtoSchema", () => {
  it("accepts supported image metadata", () => {
    expect(
      adminCreateCourseThumbnailUploadRequestDtoSchema.parse({
        fileName: "thumbnail.webp",
        contentType: "image/webp",
        contentLength: 1024,
      })
    ).toEqual({
      fileName: "thumbnail.webp",
      contentType: "image/webp",
      contentLength: 1024,
    })
  })

  it("rejects unsupported image metadata", () => {
    expect(() =>
      adminCreateCourseThumbnailUploadRequestDtoSchema.parse({
        fileName: "thumbnail.gif",
        contentType: "image/gif",
        contentLength: 1024,
      })
    ).toThrow()

    expect(() =>
      adminCreateCourseThumbnailUploadRequestDtoSchema.parse({
        fileName: "thumbnail.png",
        contentType: "image/png",
        contentLength: 5 * 1024 * 1024 + 1,
      })
    ).toThrow()
  })
})

describe("adminCreateCourseThumbnailUploadDtoSchema", () => {
  it("accepts a signed PUT upload contract", () => {
    expect(
      adminCreateCourseThumbnailUploadDtoSchema.parse({
        uploadUrl:
          "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset.png?X-Amz-Signature=abc",
        method: "PUT",
        headers: {
          "content-type": "image/png",
        },
        thumbnailPath:
          "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset.png",
      })
    ).toMatchObject({
      method: "PUT",
      headers: {
        "content-type": "image/png",
      },
    })
  })
})

describe("adminStorageUnavailableErrorDtoSchema", () => {
  it("uses a storage-specific unavailable error", () => {
    expect(
      adminStorageUnavailableErrorDtoSchema.parse({
        code: "storage-unavailable",
        message: "스토리지를 사용할 수 없습니다.",
      })
    ).toEqual({
      code: "storage-unavailable",
      message: "스토리지를 사용할 수 없습니다.",
    })
  })
})
