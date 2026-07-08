import { describe, expect, it } from "vitest"

import { createCourseImageUrl } from "@/features/courses/course-visual-assets"

describe("코스 visual asset", () => {
  it("코스 id 기준 picsum 썸네일 URL을 반환한다", () => {
    expect(createCourseImageUrl("c1")).toBe(
      "https://picsum.photos/seed/c1/600/300"
    )
    expect(createCourseImageUrl("c2", 240, 240)).toBe(
      "https://picsum.photos/seed/c2/240/240"
    )
  })
})
