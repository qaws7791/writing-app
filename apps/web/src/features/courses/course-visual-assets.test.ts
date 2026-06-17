import { describe, expect, it } from "vitest"

import { createCourseImageUrl } from "@/features/courses/course-visual-assets"

describe("코스 visual asset", () => {
  it("코스 visual key별 로컬 썸네일 경로를 반환한다", () => {
    expect(createCourseImageUrl("basic-sentence-writing")).toBe(
      "/course-thumbnails/basic-sentence-writing.png"
    )
    expect(createCourseImageUrl("grammar-complete")).toBe(
      "/course-thumbnails/grammar-complete.png"
    )
  })
})
