import { describe, expect, it } from "vitest"

import { createCourseImageUrl } from "@/features/courses/course-visual-assets"

describe("코스 visual asset", () => {
  it("visualKey 기준 로컬 썸네일 URL을 반환한다", () => {
    expect(createCourseImageUrl("basic-sentence-writing")).toBe(
      "/course-thumbnails/basic-sentence-writing.png"
    )
    expect(createCourseImageUrl("expression")).toBe(
      "/course-thumbnails/expression.png"
    )
  })
})
