import { describe, expect, it } from "vitest"

import { createCourseImageUrl } from "@/features/courses/course-image-url"

describe("코스 이미지 URL", () => {
  it("코스 ID별 로컬 썸네일 경로를 반환한다", () => {
    expect(createCourseImageUrl("c1")).toBe(
      "/course-thumbnails/basic-sentence-writing.png"
    )
  })

  it("알 수 없는 코스 ID도 외부 이미지 서비스에 의존하지 않는다", () => {
    const imageUrl = createCourseImageUrl("unknown-course")

    expect(imageUrl).toBe("/course-thumbnails/basic-sentence-writing.png")
    expect(imageUrl).not.toContain("picsum.photos")
  })
})
