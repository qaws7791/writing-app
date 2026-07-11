import { Buffer } from "node:buffer"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createCourseThumbnailHandler } from "@/app/course-thumbnails/[name]/course-thumbnail-handler"

const readFile = vi.fn()

describe("관리자 코스 썸네일 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("같은 허용 자산의 파일 읽기를 한 번만 수행한다", async () => {
    readFile.mockResolvedValue(Buffer.from([1, 2, 3]))
    const GET = createHandler()

    const first = await GET(new Request("https://admin.test"), {
      params: Promise.resolve({ name: "basic-sentence-writing.png" }),
    })
    const second = await GET(new Request("https://admin.test"), {
      params: Promise.resolve({ name: "basic-sentence-writing.png" }),
    })

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(first.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable"
    )
    expect(readFile).toHaveBeenCalledTimes(1)
  })

  it("허용되지 않은 이름과 경로 탐색을 파일 접근 전에 거부한다", async () => {
    const GET = createHandler()

    const response = await GET(new Request("https://admin.test"), {
      params: Promise.resolve({ name: "../secret.png" }),
    })

    expect(response.status).toBe(404)
    expect(readFile).not.toHaveBeenCalled()
  })

  it("허용 목록에 있지만 배포에서 누락된 파일은 404로 응답한다", async () => {
    readFile.mockRejectedValue(
      Object.assign(new Error("missing thumbnail"), { code: "ENOENT" })
    )
    const GET = createHandler()

    const response = await GET(new Request("https://admin.test"), {
      params: Promise.resolve({ name: "basic-sentence-writing.png" }),
    })

    expect(response.status).toBe(404)
  })
})

function createHandler() {
  return createCourseThumbnailHandler({
    readThumbnailFile: readFile,
    thumbnailDirectory: "C:/thumbnail-fixture",
  })
}
